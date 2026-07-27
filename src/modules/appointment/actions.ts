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

export async function listAdminAppointments(rawFilters: unknown) {
  const session = await requireSession()
  const filters = appointmentFiltersSchema.parse(rawFilters ?? {})

  const canViewAll = await can(session.user, "appointment.view.all")

  const where: Prisma.AppointmentWhereInput = {
    status: filters.status,
    realtorId: canViewAll
      ? filters.realtorId
      : (session.user.realtorId ?? "__none__"),
    scheduledAt:
      filters.from || filters.to
        ? { gte: filters.from, lte: filters.to }
        : undefined,
  }

  return appointmentRepository.listAppointments(where)
}

export async function createAppointment(input: unknown) {
  const session = await requireAppointmentManage()
  const data = appointmentInputSchema.parse(input)

  const appointment = await appointmentRepository.createAppointment({
    scheduledAt: data.scheduledAt,
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
