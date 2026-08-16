import { prisma } from "@/lib/prisma"
import type { Prisma, AppointmentStatus } from "@/generated/prisma/client"
import { upsertLeadByPhone } from "@/modules/lead/repository"
import type { LeadAttributionInput } from "@/modules/lead/repository"

const appointmentInclude = {
  realtor: { include: { user: true } },
  lead: { select: { id: true, name: true, phone: true } },
  client: { select: { id: true, name: true, phone: true } },
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
  attribution: LeadAttributionInput
}

// Fluxo público "visitante pede visita → vira Lead + Appointment
// pendente na Agenda". A cadeia de prioridade do corretor responsável
// (atribuição do visitante → corretor do imóvel → padrão/round-robin →
// mais antigo) já vem resolvida em `attribution`; aqui só usamos o
// resultado. realtorId é obrigatório no Appointment — se nem o fallback
// mais antigo encontrar um corretor ativo, não há como agendar.
export async function createVisitRequestWithLead(input: CreateVisitRequestInput) {
  return prisma.$transaction(async (tx) => {
    const now = new Date().toLocaleString("pt-BR")
    const { lead, isNew: isNewLead } = await upsertLeadByPhone(tx, {
      name: input.name,
      phone: input.phone,
      propertyId: input.propertyId,
      note: `[${now}] Solicitou agendamento de visita.${input.message ? ` ${input.message}` : ""}`,
      initialStage: "VISIT_SCHEDULED",
      advanceToStage: "VISIT_SCHEDULED",
      attribution: input.attribution,
    })

    // Respeita o corretor já vinculado ao lead (caso já exista de um
    // contato anterior) — upsertLeadByPhone nunca sobrescreve um
    // realtorId já atribuído, então lead.realtorId é a fonte de verdade.
    const realtorId = lead.realtorId
    if (!realtorId) {
      throw new Error("Nenhum corretor disponível para atribuir a visita.")
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

    return { lead, appointment, isNewLead }
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

// Sem soft-delete aqui (diferente de Lead/Client/Property) — um
// compromisso errado é removido de verdade; o histórico de negócio real
// já fica marcado via status (CANCELED/NO_SHOW), não via exclusão.
export async function deleteAppointment(id: string) {
  return prisma.appointment.delete({ where: { id } })
}

// Conflito = outro compromisso não cancelado do mesmo corretor cuja
// janela [scheduledAt, scheduledAt+duration) se sobrepõe à nova janela.
export async function findConflicts(input: {
  realtorId: string
  scheduledAt: Date
  durationMinutes: number
  excludeId?: string
}) {
  const start = input.scheduledAt
  const end = new Date(start.getTime() + input.durationMinutes * 60000)

  const candidates = await prisma.appointment.findMany({
    where: {
      realtorId: input.realtorId,
      status: { notIn: ["CANCELED"] },
      id: input.excludeId ? { not: input.excludeId } : undefined,
      // Janela generosa (±6h) pra reduzir candidatos antes do filtro
      // preciso em memória (Postgres não compara facilmente contra uma
      // expressão calculada de fim sem uma coluna gerada).
      scheduledAt: {
        gte: new Date(start.getTime() - 6 * 60 * 60000),
        lte: new Date(end.getTime() + 6 * 60 * 60000),
      },
    },
    include: appointmentInclude,
  })

  return candidates.filter((candidate) => {
    const candidateStart = candidate.scheduledAt
    const candidateEnd = new Date(candidateStart.getTime() + candidate.durationMinutes * 60000)
    return candidateStart < end && start < candidateEnd
  })
}

export async function getAppointmentStats(where: Prisma.AppointmentWhereInput) {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const [today, week, confirmed, scheduled, done, noShow, canceled] = await Promise.all([
    prisma.appointment.count({ where: { ...where, scheduledAt: { gte: todayStart, lte: todayEnd } } }),
    prisma.appointment.count({ where: { ...where, scheduledAt: { gte: weekStart, lte: weekEnd } } }),
    prisma.appointment.count({ where: { ...where, status: "CONFIRMED" } }),
    prisma.appointment.count({ where: { ...where, status: "SCHEDULED" } }),
    prisma.appointment.count({ where: { ...where, status: "DONE" } }),
    prisma.appointment.count({ where: { ...where, status: "NO_SHOW" } }),
    prisma.appointment.count({ where: { ...where, status: "CANCELED" } }),
  ])

  const attendanceBase = done + noShow
  const attendanceRate = attendanceBase > 0 ? Math.round((done / attendanceBase) * 100) : null

  return { today, week, confirmed, pending: scheduled, attendanceRate, canceled }
}
