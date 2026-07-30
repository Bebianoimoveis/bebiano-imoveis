"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { logActivity } from "@/lib/activity-log"
import { isRateLimited } from "@/lib/rate-limit"
import type { Prisma, AppointmentStatus } from "@/generated/prisma/client"
import {
  appointmentFiltersSchema,
  appointmentInputSchema,
  appointmentRescheduleSchema,
} from "@/modules/appointment/schema"
import * as appointmentRepository from "@/modules/appointment/repository"
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

// Checagem de conflito usada pelo Sheet de criação/edição e pelo
// drag-and-drop antes de confirmar — só avisa, nunca bloqueia.
export async function checkAppointmentConflict(input: {
  realtorId: string
  scheduledAt: Date | string
  durationMinutes: number
  excludeId?: string
}) {
  await requireSession()
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

  const appointment = await appointmentRepository.createAppointment({
    scheduledAt: data.scheduledAt,
    durationMinutes: data.durationMinutes,
    type: data.type,
    notes: data.notes,
    realtor: { connect: { id: data.realtorId } },
    lead: data.leadId ? { connect: { id: data.leadId } } : undefined,
    client: data.clientId ? { connect: { id: data.clientId } } : undefined,
    property: data.propertyId ? { connect: { id: data.propertyId } } : undefined,
  })

  await logActivity({
    userId: session.user.id,
    action: "appointment.create",
    entityType: "Appointment",
    entityId: appointment.id,
  })

  revalidatePath("/admin/agenda")
  if (data.leadId) revalidatePath(`/admin/leads/${data.leadId}`)
  return appointment
}

export async function updateAppointment(id: string, input: unknown) {
  const session = await requireAppointmentManage()
  const data = appointmentInputSchema.parse(input)

  const appointment = await appointmentRepository.updateAppointment(id, {
    scheduledAt: data.scheduledAt,
    durationMinutes: data.durationMinutes,
    type: data.type,
    notes: data.notes,
    realtor: { connect: { id: data.realtorId } },
    lead: data.leadId ? { connect: { id: data.leadId } } : { disconnect: true },
    client: data.clientId ? { connect: { id: data.clientId } } : { disconnect: true },
    property: data.propertyId ? { connect: { id: data.propertyId } } : { disconnect: true },
  })

  await logActivity({
    userId: session.user.id,
    action: "appointment.edit",
    entityType: "Appointment",
    entityId: id,
  })

  revalidatePath("/admin/agenda")
  return appointment
}

// Reagendamento via drag-and-drop — atalho pra não exigir o formulário
// inteiro só pra mudar o horário.
export async function rescheduleAppointment(id: string, input: unknown) {
  const session = await requireAppointmentManage()
  const data = appointmentRescheduleSchema.parse(input)

  const appointment = await appointmentRepository.updateAppointment(id, {
    scheduledAt: data.scheduledAt,
  })

  await logActivity({
    userId: session.user.id,
    action: "appointment.reschedule",
    entityType: "Appointment",
    entityId: id,
  })

  revalidatePath("/admin/agenda")
  return appointment
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
) {
  const session = await requireAppointmentManage()
  const appointment = await appointmentRepository.updateAppointmentStatus(id, status)

  await logActivity({
    userId: session.user.id,
    action: `appointment.status.${status.toLowerCase()}`,
    entityType: "Appointment",
    entityId: id,
  })

  revalidatePath("/admin/agenda")
  return appointment
}

export async function deleteAppointment(id: string) {
  const session = await requireAppointmentManage()
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
