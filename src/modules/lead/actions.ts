"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { logActivity } from "@/lib/activity-log"
import { isRateLimited } from "@/lib/rate-limit"
import type { Prisma, LeadStage } from "@/generated/prisma/client"
import {
  contactRequestSchema,
  leadFiltersSchema,
  leadInteractionSchema,
  leadUpdateSchema,
} from "@/modules/lead/schema"
import * as leadRepository from "@/modules/lead/repository"
import * as leadService from "@/modules/lead/service"
import { SpamRejectedError } from "@/modules/lead/service"
import * as clientRepository from "@/modules/client/repository"

const GENERIC_SUCCESS_MESSAGE =
  "Recebemos seu contato! Em breve um corretor falará com você."

export type SubmitContactState = {
  status: "idle" | "success" | "error"
  message?: string
}

async function getClientIp() {
  const headerList = await headers()
  const forwardedFor = headerList.get("x-forwarded-for")
  return forwardedFor?.split(",")[0]?.trim() ?? "unknown"
}

// Uso público — sem autenticação. Protegido por honeypot/time-trap
// (ver lead/service.ts) e por rate limit por IP.
export async function submitContactRequest(
  input: unknown
): Promise<SubmitContactState> {
  const ip = await getClientIp()

  if (isRateLimited(`contact:${ip}`, { maxAttempts: 5, windowMs: 10 * 60 * 1000 })) {
    return {
      status: "error",
      message: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    }
  }

  const parsed = contactRequestSchema.safeParse(input)
  if (!parsed.success) {
    return { status: "error", message: "Verifique os dados informados." }
  }

  try {
    await leadService.submitPublicContactRequest(parsed.data, ip)
    return { status: "success", message: GENERIC_SUCCESS_MESSAGE }
  } catch (error) {
    if (error instanceof SpamRejectedError) {
      // Não cria nenhum registro, mas responde como se tivesse dado certo
      // para não sinalizar ao bot que a tentativa foi detectada.
      return { status: "success", message: GENERIC_SUCCESS_MESSAGE }
    }

    console.error("submitContactRequest failed", error)
    return {
      status: "error",
      message: "Não foi possível enviar seu contato. Tente novamente em instantes.",
    }
  }
}

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new Error("Não autenticado.")
  return session
}

// Corretores sem lead.view.all só enxergam os próprios leads. O sentinel
// garante zero resultados caso o usuário não tenha realtorId vinculado.
async function buildLeadScopeWhere(
  session: Awaited<ReturnType<typeof requireSession>>,
  filters: { stage?: LeadStage; realtorId?: string; search?: string }
): Promise<Prisma.LeadWhereInput> {
  const canViewAll = await can(session.user, "lead.view.all")

  return {
    stage: filters.stage,
    realtorId: canViewAll
      ? filters.realtorId
      : (session.user.realtorId ?? "__none__"),
    name: filters.search ? { contains: filters.search, mode: "insensitive" } : undefined,
  }
}

export async function listAdminLeads(rawFilters: unknown) {
  const session = await requireSession()
  const filters = leadFiltersSchema.parse(rawFilters ?? {})
  const where = await buildLeadScopeWhere(session, filters)

  return leadRepository.listLeads(where)
}

export async function getAdminLead(id: string) {
  const session = await requireSession()
  const lead = await leadRepository.findLeadById(id)
  if (!lead) return null

  const canViewAll = await can(session.user, "lead.view.all")
  if (!canViewAll && lead.realtorId !== session.user.realtorId) {
    throw new Error("Sem permissão para visualizar este lead.")
  }

  return lead
}

async function assertCanManageLead(
  session: Awaited<ReturnType<typeof requireSession>>,
  leadId: string
) {
  if (!(await can(session.user, "lead.manage"))) {
    throw new Error("Sem permissão para gerenciar leads.")
  }

  const canViewAll = await can(session.user, "lead.view.all")
  if (canViewAll) return

  const lead = await leadRepository.findLeadById(leadId)
  if (!lead || lead.realtorId !== session.user.realtorId) {
    throw new Error("Sem permissão para gerenciar este lead.")
  }
}

export async function updateLeadStage(leadId: string, stage: LeadStage) {
  const session = await requireSession()
  await assertCanManageLead(session, leadId)

  const lead = await leadRepository.updateLeadStage(leadId, stage)

  await logActivity({
    userId: session.user.id,
    action: `lead.stage.${stage.toLowerCase()}`,
    entityType: "Lead",
    entityId: leadId,
  })

  revalidatePath("/admin/leads")
  return lead
}

export async function updateLead(leadId: string, input: unknown) {
  const session = await requireSession()
  await assertCanManageLead(session, leadId)

  const data = leadUpdateSchema.parse(input)
  const lead = await leadRepository.updateLead(leadId, {
    notes: data.notes,
    nextActionAt: data.nextActionAt,
    // data.realtorId: undefined (não enviado) → não mexe no vínculo;
    // null → desvincula; string → atribui.
    ...(data.realtorId === undefined
      ? {}
      : {
          realtor: data.realtorId
            ? { connect: { id: data.realtorId } }
            : { disconnect: true },
        }),
  })

  revalidatePath("/admin/leads")
  revalidatePath(`/admin/leads/${leadId}`)
  return lead
}

export async function addLeadInteraction(leadId: string, input: unknown) {
  const session = await requireSession()
  await assertCanManageLead(session, leadId)

  const data = leadInteractionSchema.parse(input)
  await leadRepository.createLeadInteraction({
    leadId,
    userId: session.user.id,
    type: data.type,
    description: data.description,
  })

  revalidatePath(`/admin/leads/${leadId}`)
}

export async function convertLeadToClient(leadId: string) {
  const session = await requireSession()
  await assertCanManageLead(session, leadId)

  if (!(await can(session.user, "client.manage"))) {
    throw new Error("Sem permissão para gerenciar clientes.")
  }

  const lead = await leadRepository.findLeadById(leadId)
  if (!lead) throw new Error("Lead não encontrado.")
  if (lead.clientId) return lead

  const client = await clientRepository.createClient({
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
  })

  const updated = await leadRepository.updateLead(leadId, {
    client: { connect: { id: client.id } },
  })

  await logActivity({
    userId: session.user.id,
    action: "lead.convert_to_client",
    entityType: "Lead",
    entityId: leadId,
    metadata: { clientId: client.id },
  })

  revalidatePath(`/admin/leads/${leadId}`)
  revalidatePath("/admin/clientes")
  return updated
}
