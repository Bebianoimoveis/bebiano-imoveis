import { prisma } from "@/lib/prisma"
import type { Prisma, AppointmentStatus } from "@/generated/prisma/client"
import { upsertLeadByPhone } from "@/modules/lead/repository"

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

type CreateVisitRequestInput = {
  name: string
  phone: string
  propertyId: string
  scheduledAt: Date
  message?: string
}

// Fluxo público "visitante pede visita → vira Lead + Appointment
// pendente na Agenda". realtorId é obrigatório no Appointment, então
// usamos o corretor já responsável pelo imóvel; se o imóvel não tiver
// um vinculado, cai para o corretor ativo mais antigo (a visita aparece
// na Agenda para qualquer corretor reatribuir depois).
export async function createVisitRequestWithLead(input: CreateVisitRequestInput) {
  return prisma.$transaction(async (tx) => {
    const now = new Date().toLocaleString("pt-BR")
    const lead = await upsertLeadByPhone(tx, {
      name: input.name,
      phone: input.phone,
      propertyId: input.propertyId,
      note: `[${now}] Solicitou agendamento de visita.${input.message ? ` ${input.message}` : ""}`,
      initialStage: "VISIT_SCHEDULED",
      advanceToStage: "VISIT_SCHEDULED",
    })

    // Respeita o corretor já vinculado ao lead (caso já exista de um
    // contato anterior); só cai para o do imóvel/fallback se ainda não
    // tiver nenhum.
    let realtorId = lead.realtorId
    if (!realtorId) {
      const property = await tx.property.findUnique({
        where: { id: input.propertyId },
        select: { realtorId: true },
      })
      realtorId = property?.realtorId ?? null
    }
    if (!realtorId) {
      const fallbackRealtor = await tx.realtor.findFirst({
        where: { active: true, deletedAt: null },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      })
      realtorId = fallbackRealtor?.id ?? null
    }
    if (!realtorId) {
      throw new Error("Nenhum corretor disponível para atribuir a visita.")
    }

    if (lead.realtorId !== realtorId) {
      await tx.lead.update({ where: { id: lead.id }, data: { realtorId } })
    }

    const appointment = await tx.appointment.create({
      data: {
        leadId: lead.id,
        propertyId: input.propertyId,
        realtorId,
        scheduledAt: input.scheduledAt,
        notes: input.message || null,
      },
    })

    return { lead, appointment }
  })
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
