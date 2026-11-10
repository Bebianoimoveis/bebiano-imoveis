"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { logActivity } from "@/lib/activity-log"
import { isRateLimited } from "@/lib/rate-limit"
import type { Prisma, AppointmentStatus, LeadStage } from "@/generated/prisma/client"
import {
  appointmentFiltersSchema,
  appointmentInputSchema,
  appointmentRescheduleSchema,
} from "@/modules/appointment/schema"
import * as appointmentRepository from "@/modules/appointment/repository"
import * as leadRepository from "@/modules/lead/repository"
import * as clientRepository from "@/modules/client/repository"
import { visitRequestSchema } from "@/modules/lead/schema"
import { submitPublicVisitRequest } from "@/modules/lead/service"
import { SpamRejectedError } from "@/modules/lead/service"

const VISIT_SUCCESS_MESSAGE =
  "Visita solicitada! Em breve um corretor confirma o horário com você."

export type SubmitVisitState = {
  status: "idle" | "success" | "error"
  message?: string
}

// Uso público — sem autenticação. Mesmo padrão de proteção do formulário
// de contato: honeypot/time-trap (lead/service.ts) + rate limit por IP.
export async function submitVisitRequest(
  input: unknown
): Promise<SubmitVisitState> {
  const headerList = await headers()
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"

  if (isRateLimited(`visit:${ip}`, { maxAttempts: 5, windowMs: 10 * 60 * 1000 })) {
    return {
      status: "error",
      message: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    }
  }

  const parsed = visitRequestSchema.safeParse(input)
  if (!parsed.success) {
    return { status: "error", message: "Verifique os dados informados." }
  }

  try {
    await submitPublicVisitRequest(parsed.data)
    return { status: "success", message: VISIT_SUCCESS_MESSAGE }
  } catch (error) {
    if (error instanceof SpamRejectedError) {
      return { status: "success", message: VISIT_SUCCESS_MESSAGE }
    }

    console.error("submitVisitRequest failed", error)
    return {
      status: "error",
      message: "Não foi possível agendar a visita. Tente novamente em instantes.",
    }
  }
}

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new Error("Não autenticado.")
  return session
}

async function requireAppointmentManage() {
  const session = await requireSession()
  if (!(await can(session.user, "appointment.manage"))) {
    throw new Error("Sem permissão para gerenciar a agenda.")
  }
  return session
}

// Sem isso, `appointment.manage` sozinho bastava pra editar/excluir/
// reagendar o compromisso de QUALQUER corretor — bastava saber o id.
// Mesmo padrão de posse já usado em lead/actions.ts (assertCanManageLead).
async function assertCanManageAppointment(
  session: Awaited<ReturnType<typeof requireAppointmentManage>>,
  id: string
) {
  const canViewAll = await can(session.user, "appointment.view.all")
  if (canViewAll) return

  const appointment = await appointmentRepository.findAppointmentById(id)
  if (!appointment || appointment.realtorId !== session.user.realtorId) {
    throw new Error("Sem permissão para gerenciar este compromisso.")
  }
}

async function buildAppointmentScopeWhere(
  session: Awaited<ReturnType<typeof requireSession>>,
  filters: ReturnType<typeof appointmentFiltersSchema.parse>
): Promise<Prisma.AppointmentWhereInput> {
  const canViewAll = await can(session.user, "appointment.view.all")

  return {
    status: filters.status,
    type: filters.type,
    realtorId: filters.mine
      ? (session.user.realtorId ?? "__none__")
      : canViewAll
        ? filters.realtorId
        : (session.user.realtorId ?? "__none__"),
    scheduledAt:
      filters.from || filters.to
        ? { gte: filters.from, lte: filters.to }
        : undefined,
  }
}

export async function listAdminAppointments(rawFilters: unknown) {
  const session = await requireSession()
  const filters = appointmentFiltersSchema.parse(rawFilters ?? {})
  const where = await buildAppointmentScopeWhere(session, filters)

  return appointmentRepository.listAppointments(where)
}

export async function getAppointmentStats(rawFilters: unknown) {
  const session = await requireSession()
  const filters = appointmentFiltersSchema.parse(rawFilters ?? {})
  const where = await buildAppointmentScopeWhere(session, filters)

  return appointmentRepository.getAppointmentStats(where)
}

// Mesmo corretor não pode ter dois compromissos com horário cruzado —
// bloqueado aqui no servidor (criar, editar, arrastar, reativar), não só
// avisado na tela. Corretores diferentes no mesmo horário podem.
const ACTIVE_STATUSES: AppointmentStatus[] = ["SCHEDULED", "CONFIRMED"]

function brazilTime(date: Date) {
  return date.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })
}

function conflictMessage(conflict: appointmentRepository.AppointmentListItem) {
  const start = conflict.scheduledAt
  const end = new Date(start.getTime() + conflict.durationMinutes * 60000)
  const day = start.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
  const who = conflict.lead?.name ?? conflict.client?.name
  return (
    `Horário indisponível: ${conflict.realtor.user.name} já tem um compromisso${who ? ` com ${who}` : ""} ` +
    `em ${day}, das ${brazilTime(start)} às ${brazilTime(end)}. Escolha outro horário ou outro corretor.`
  )
}

async function findBlockingConflict(
  tx: Prisma.TransactionClient,
  input: { realtorId: string; scheduledAt: Date; durationMinutes: number; excludeId?: string }
) {
  const conflicts = await appointmentRepository.findConflicts(input, tx)
  return conflicts[0] ? conflictMessage(conflicts[0]) : null
}

// Checagem de conflito usada pelo Sheet de criação/edição pra avisar
// enquanto a pessoa escolhe o horário (o bloqueio de verdade é no salvar).
export async function checkAppointmentConflict(input: {
  realtorId: string
  scheduledAt: Date | string
  durationMinutes: number
  excludeId?: string
}) {
  const session = await requireSession()

  // Sem essa checagem, qualquer usuário logado podia passar o realtorId de
  // um colega e receber nome/telefone dos leads/clientes dele de volta —
  // a resposta inclui esses dados pra exibir o aviso de conflito.
  const canViewAll = await can(session.user, "appointment.view.all")
  if (!canViewAll && input.realtorId !== session.user.realtorId) {
    return []
  }

  const conflicts = await appointmentRepository.findConflicts({
    realtorId: input.realtorId,
    scheduledAt: new Date(input.scheduledAt),
    durationMinutes: input.durationMinutes,
    excludeId: input.excludeId,
  })
  return conflicts
}

export async function createAppointment(input: unknown) {
  const session = await requireAppointmentManage()
  const data = appointmentInputSchema.parse(input)

  // Sem isso, um Corretor sem appointment.view.all podia criar um
  // compromisso em nome de outro corretor (realtorId livre vindo do
  // client) e vincular lead/cliente que não são dele — o "connect" só
  // falha se o id não existir, então também servia pra confirmar por
  // tentativa e erro se um determinado lead/cliente de outro corretor
  // existe.
  const canViewAll = await can(session.user, "appointment.view.all")
  const realtorId = canViewAll ? data.realtorId : (session.user.realtorId ?? data.realtorId)
  if (!canViewAll && realtorId !== session.user.realtorId) {
    throw new Error("Sem permissão para agendar em nome de outro corretor.")
  }

  if (!canViewAll && data.leadId) {
    const lead = await leadRepository.findLeadById(data.leadId)
    if (!lead || lead.realtorId !== session.user.realtorId) {
      throw new Error("Sem permissão para vincular este lead.")
    }
  }
  if (!canViewAll && data.clientId) {
    const client = await clientRepository.findClientById(data.clientId)
    if (!client || client.realtorId !== session.user.realtorId) {
      throw new Error("Sem permissão para vincular este cliente.")
    }
  }

  const result = await appointmentRepository.withRealtorScheduleLock(realtorId, async (tx) => {
    const conflict = await findBlockingConflict(tx, {
      realtorId,
      scheduledAt: data.scheduledAt,
      durationMinutes: data.durationMinutes,
    })
    if (conflict) return { error: conflict }
    return {
      appointment: await appointmentRepository.createAppointmentTx(tx, {
        scheduledAt: data.scheduledAt,
        durationMinutes: data.durationMinutes,
        type: data.type,
        typeLabel: data.type === "OTHER" ? data.typeLabel || null : null,
        notes: data.notes,
        realtor: { connect: { id: realtorId } },
        lead: data.leadId ? { connect: { id: data.leadId } } : undefined,
        client: data.clientId ? { connect: { id: data.clientId } } : undefined,
        property: data.propertyId ? { connect: { id: data.propertyId } } : undefined,
      }),
    }
  })
  if ("error" in result) return { error: result.error as string }
  const { appointment } = result

  await logActivity({
    userId: session.user.id,
    action: "appointment.create",
    entityType: "Appointment",
    entityId: appointment.id,
  })

  // Agendar uma visita move o lead sozinho pro estágio "Visita agendada"
  // — só avança (nunca regride quem já está mais adiante no funil, ex:
  // em Proposta/Negociação, nem mexe em quem já fechou/perdeu).
  if (data.type === "VISIT" && data.leadId) {
    const lead = await leadRepository.findLeadById(data.leadId)
    const stagesBeforeVisit: LeadStage[] = ["NEW", "FIRST_CONTACT", "QUALIFIED"]
    if (lead && stagesBeforeVisit.includes(lead.stage)) {
      await leadRepository.updateLeadStage(data.leadId, "VISIT_SCHEDULED")
      await logActivity({
        userId: session.user.id,
        action: "lead.stage.visit_scheduled",
        entityType: "Lead",
        entityId: data.leadId,
      })
    }
  }

  revalidatePath("/admin/agenda")
  if (data.leadId) revalidatePath(`/admin/leads/${data.leadId}`)
  return { appointment }
}

export async function updateAppointment(id: string, input: unknown) {
  const session = await requireAppointmentManage()
  await assertCanManageAppointment(session, id)
  const data = appointmentInputSchema.parse(input)

  const current = await appointmentRepository.findAppointmentById(id)
  const result = await appointmentRepository.withRealtorScheduleLock(data.realtorId, async (tx) => {
    // Cancelado/realizado não ocupa a agenda — só checa se ele está ativo.
    if (current && ACTIVE_STATUSES.includes(current.status)) {
      const conflict = await findBlockingConflict(tx, {
        realtorId: data.realtorId,
        scheduledAt: data.scheduledAt,
        durationMinutes: data.durationMinutes,
        excludeId: id,
      })
      if (conflict) return { error: conflict }
    }
    return {
      appointment: await appointmentRepository.updateAppointmentTx(tx, id, {
        scheduledAt: data.scheduledAt,
        durationMinutes: data.durationMinutes,
        type: data.type,
        typeLabel: data.type === "OTHER" ? data.typeLabel || null : null,
        notes: data.notes,
        realtor: { connect: { id: data.realtorId } },
        lead: data.leadId ? { connect: { id: data.leadId } } : { disconnect: true },
        client: data.clientId ? { connect: { id: data.clientId } } : { disconnect: true },
        property: data.propertyId ? { connect: { id: data.propertyId } } : { disconnect: true },
      }),
    }
  })
  if ("error" in result) return { error: result.error as string }
  const { appointment } = result

  await logActivity({
    userId: session.user.id,
    action: "appointment.edit",
    entityType: "Appointment",
    entityId: id,
  })

  revalidatePath("/admin/agenda")
  return { appointment }
}

// Reagendamento via drag-and-drop — atalho pra não exigir o formulário
// inteiro só pra mudar o horário.
export async function rescheduleAppointment(id: string, input: unknown) {
  const session = await requireAppointmentManage()
  await assertCanManageAppointment(session, id)
  const data = appointmentRescheduleSchema.parse(input)

  const current = await appointmentRepository.findAppointmentById(id)
  if (!current) return { error: "Compromisso não encontrado." }
  const result = await appointmentRepository.withRealtorScheduleLock(current.realtorId, async (tx) => {
    if (ACTIVE_STATUSES.includes(current.status)) {
      const conflict = await findBlockingConflict(tx, {
        realtorId: current.realtorId,
        scheduledAt: data.scheduledAt,
        durationMinutes: current.durationMinutes,
        excludeId: id,
      })
      if (conflict) return { error: conflict }
    }
    return { appointment: await appointmentRepository.updateAppointmentTx(tx, id, { scheduledAt: data.scheduledAt }) }
  })
  if ("error" in result) return { error: result.error as string }
  const { appointment } = result

  await logActivity({
    userId: session.user.id,
    action: "appointment.reschedule",
    entityType: "Appointment",
    entityId: id,
  })

  revalidatePath("/admin/agenda")
  return { appointment }
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
) {
  const session = await requireAppointmentManage()
  await assertCanManageAppointment(session, id)

  // Voltar um cancelado/realizado pra Agendado/Confirmado (ou confirmar
  // um pedido de visita do site) volta a ocupar a agenda — checa o horário.
  const current = await appointmentRepository.findAppointmentById(id)
  if (!current) return { error: "Compromisso não encontrado." }
  const result = await appointmentRepository.withRealtorScheduleLock(current.realtorId, async (tx) => {
    if (ACTIVE_STATUSES.includes(status)) {
      const conflict = await findBlockingConflict(tx, {
        realtorId: current.realtorId,
        scheduledAt: current.scheduledAt,
        durationMinutes: current.durationMinutes,
        excludeId: id,
      })
      if (conflict) return { error: conflict }
    }
    return { appointment: await appointmentRepository.updateAppointmentTx(tx, id, { status }) }
  })
  if ("error" in result) return { error: result.error as string }
  const { appointment } = result

  await logActivity({
    userId: session.user.id,
    action: `appointment.status.${status.toLowerCase()}`,
    entityType: "Appointment",
    entityId: id,
  })

  revalidatePath("/admin/agenda")
  return { appointment }
}

export async function deleteAppointment(id: string) {
  const session = await requireAppointmentManage()
  await assertCanManageAppointment(session, id)
  await appointmentRepository.deleteAppointment(id)

  await logActivity({
    userId: session.user.id,
    action: "appointment.delete",
    entityType: "Appointment",
    entityId: id,
  })

  revalidatePath("/admin/agenda")
}

// Monta o conteúdo de um arquivo .ics a partir dos compromissos do
// filtro atual — é a interpretação honesta de "Google Calendar Ready"
// possível sem OAuth/API paga: qualquer app de calendário (Google, Apple,
// Outlook) importa esse formato padrão manualmente.
function toIcsDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
}

function icsEscape(text: string) {
  return text.replace(/[,;\\]/g, (match) => `\\${match}`).replace(/\n/g, "\\n")
}

export async function exportAppointmentsIcs(rawFilters: unknown) {
  const session = await requireSession()
  const filters = appointmentFiltersSchema.parse(rawFilters ?? {})
  const where = await buildAppointmentScopeWhere(session, filters)
  const appointments = await appointmentRepository.listAppointments(where)

  const lines: (string | null)[] = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Bebiano Imoveis//Agenda//PT-BR"]

  for (const appointment of appointments) {
    const start = new Date(appointment.scheduledAt)
    const end = new Date(start.getTime() + appointment.durationMinutes * 60000)
    const who = appointment.lead?.name ?? appointment.client?.name ?? "Compromisso"
    const summary = `${who} · ${appointment.realtor.user.name}`
    const descriptionParts = [
      appointment.property ? `Imóvel: ${appointment.property.code} - ${appointment.property.title}` : null,
      appointment.notes ?? null,
    ].filter(Boolean) as string[]

    lines.push(
      "BEGIN:VEVENT",
      `UID:${appointment.id}@bebianoimoveis.com.br`,
      `DTSTAMP:${toIcsDate(new Date())}`,
      `DTSTART:${toIcsDate(start)}`,
      `DTEND:${toIcsDate(end)}`,
      `SUMMARY:${icsEscape(summary)}`,
      descriptionParts.length > 0 ? `DESCRIPTION:${icsEscape(descriptionParts.join(" · "))}` : null,
      "END:VEVENT"
    )
  }

  lines.push("END:VCALENDAR")
  return lines.filter(Boolean).join("\r\n")
}
