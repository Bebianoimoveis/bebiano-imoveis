"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { logActivity } from "@/lib/activity-log"
import type { Prisma, AppointmentStatus } from "@/generated/prisma/client"
import {
  appointmentFiltersSchema,
  appointmentInputSchema,
} from "@/modules/appointment/schema"
import * as appointmentRepository from "@/modules/appointment/repository"

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
