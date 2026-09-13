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
  leadCreateSchema,
  leadFiltersSchema,
  leadInteractionSchema,
  leadUpdateSchema,
} from "@/modules/lead/schema"
import * as leadRepository from "@/modules/lead/repository"
import * as leadService from "@/modules/lead/service"
import { SpamRejectedError } from "@/modules/lead/service"
import * as notificationService from "@/modules/notification/service"
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
  filters: ReturnType<typeof leadFiltersSchema.parse>
): Promise<Prisma.LeadWhereInput> {
  const canViewAll = await can(session.user, "lead.view.all")

  return {
    stage: filters.stage,
    realtorId: canViewAll
      ? filters.realtorId
      : (session.user.realtorId ?? "__none__"),
    temperature: filters.temperature,
    origin: filters.origin,
    createdAt:
      filters.createdFrom || filters.createdTo
        ? { gte: filters.createdFrom, lte: filters.createdTo }
        : undefined,
    lastInteractionAt:
      filters.lastInteractionFrom || filters.lastInteractionTo
        ? { gte: filters.lastInteractionFrom, lte: filters.lastInteractionTo }
        : undefined,
    property:
      filters.minValue || filters.maxValue || filters.cityId
        ? {
            cityId: filters.cityId,
            price:
              filters.minValue || filters.maxValue
                ? { gte: filters.minValue, lte: filters.maxValue }
                : undefined,
          }
        : undefined,
    OR: filters.search
      ? [
          { name: { contains: filters.search, mode: "insensitive" } },
          { phone: { contains: filters.search } },
          { email: { contains: filters.search, mode: "insensitive" } },
          { property: { title: { contains: filters.search, mode: "insensitive" } } },
          { property: { city: { name: { contains: filters.search, mode: "insensitive" } } } },
          { realtor: { user: { name: { contains: filters.search, mode: "insensitive" } } } },
        ]
      : undefined,
  }
}

export async function listAdminLeads(rawFilters: unknown) {
  const session = await requireSession()
  const filters = leadFiltersSchema.parse(rawFilters ?? {})
  const where = await buildLeadScopeWhere(session, filters)

  return leadRepository.listLeads(where)
}

// Sugestões instantâneas da busca — mesmo escopo de visibilidade da
// listagem.
export async function suggestLeads(query: string) {
  const session = await requireSession()
  if (query.trim().length < 2) return []

  const canViewAll = await can(session.user, "lead.view.all")
  const where: Prisma.LeadWhereInput = {
    realtorId: canViewAll ? undefined : (session.user.realtorId ?? "__none__"),
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { phone: { contains: query } },
    ],
  }

  return leadRepository.suggestLeads(where, 6)
}

// KPIs do topo do CRM — período controla "novos leads" (padrão 30 dias).
export async function getLeadCrmStats(rawFilters: unknown, periodDays = 30) {
  const session = await requireSession()
  const filters = leadFiltersSchema.parse(rawFilters ?? {})
  const where = await buildLeadScopeWhere(session, filters)

  const canViewAll = await can(session.user, "appointment.view.all")
  const appointmentWhere: Prisma.AppointmentWhereInput = canViewAll
    ? {}
    : { realtorId: session.user.realtorId ?? "__none__" }

  const periodFrom = new Date()
  periodFrom.setDate(periodFrom.getDate() - periodDays)

  return leadRepository.getLeadStats(where, periodFrom, appointmentWhere)
}

function toCsvValue(value: string | number) {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export async function exportLeadsCsv(rawFilters: unknown) {
  const session = await requireSession()
  const filters = leadFiltersSchema.parse(rawFilters ?? {})
  const where = await buildLeadScopeWhere(session, filters)

  const leads = await leadRepository.listLeads(where)

  const header = ["Nome", "Telefone", "E-mail", "Origem", "Etapa", "Imóvel", "Corretor", "Criado em"]
  const rows = leads.map((lead) => [
    lead.name,
    lead.phone,
    lead.email ?? "",
    lead.origin,
    lead.stage,
    lead.property?.title ?? "",
    lead.realtor?.user.name ?? "",
    lead.createdAt.toLocaleDateString("pt-BR"),
  ])

  return [header, ...rows].map((row) => row.map(toCsvValue).join(",")).join("\n")
}

export async function createLeadManually(input: unknown) {
  const session = await requireSession()
  if (!(await can(session.user, "lead.manage"))) {
    throw new Error("Sem permissão para cadastrar leads.")
  }

  const data = leadCreateSchema.parse(input)
  const lead = await leadRepository.createLeadManually({
    ...data,
    createdById: session.user.id,
  })

  await logActivity({
    userId: session.user.id,
    action: "lead.create_manual",
    entityType: "Lead",
    entityId: lead.id,
  })

  void notificationService.notifyNewLead(
    { id: lead.id, name: lead.name, realtorId: lead.realtorId, origin: lead.origin },
    session.user.id
  )

  revalidatePath("/admin/leads")
  return lead
}

export async function deleteLead(leadId: string) {
  const session = await requireSession()
  await assertCanManageLead(session, leadId)

  await leadRepository.softDeleteLead(leadId)

  await logActivity({
    userId: session.user.id,
    action: "lead.delete",
    entityType: "Lead",
    entityId: leadId,
  })

  revalidatePath("/admin/leads")
}

export async function getLeadContract(leadId: string) {
  const session = await requireSession()
  await assertCanManageLead(session, leadId)
  return leadRepository.findAcceptedContractByLead(leadId)
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
    temperature: data.temperature,
    vip: data.vip,
    tags: data.tags,
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
    origin: lead.origin,
    realtorId: lead.realtorId,
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
