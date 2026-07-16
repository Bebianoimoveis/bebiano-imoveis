import { prisma } from "@/lib/prisma"
import type { Prisma, AppointmentStatus } from "@/generated/prisma/client"

const appointmentInclude = {
  realtor: { include: { user: true } },
  lead: { select: { id: true, name: true } },
  client: { select: { id: true, name: true } },
  property: { select: { id: true, title: true, code: true } },
} satisfies Prisma.AppointmentInclude

export type AppointmentListItem = Prisma.AppointmentGetPayload<{
  include: typeof appointmentInclude
}>

export async function listAppointments(
  where: Prisma.AppointmentWhereInput
): Promise<AppointmentListItem[]> {
  return prisma.appointment.findMany({
    where,
    include: appointmentInclude,
    orderBy: { scheduledAt: "asc" },
  })
}

export async function findAppointmentById(
  id: string
): Promise<AppointmentListItem | null> {
  return prisma.appointment.findUnique({
    where: { id },
    include: appointmentInclude,
  })
}

export async function createAppointment(data: Prisma.AppointmentCreateInput) {
  return prisma.appointment.create({ data, include: appointmentInclude })
}

export async function updateAppointment(
  id: string,
  data: Prisma.AppointmentUpdateInput
) {
  return prisma.appointment.update({
    where: { id },
    data,
    include: appointmentInclude,
  })
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
) {
  return prisma.appointment.update({
    where: { id },
    data: { status },
    include: appointmentInclude,
  })
}
