import { prisma } from "@/lib/prisma"
import type { Prisma, AppointmentStatus } from "@/generated/prisma/client"
import { upsertLeadByPhone } from "@/modules/lead/repository"
import type { LeadAttributionInput } from "@/modules/lead/repository"
import { startOfDayBrazil, endOfDayBrazil } from "@/lib/date"

// realtor.user só com id/nome — a lista vai pro navegador, e o User
// completo levaria o hash de senha junto.
const appointmentInclude = {
  realtor: { include: { user: { select: { id: true, name: true } } } },
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

type Db = Prisma.TransactionClient | typeof prisma

// Trava a agenda de um corretor durante a transação (advisory lock do
// Postgres, liberado sozinho no fim): dois agendamentos salvos ao mesmo
// tempo pro mesmo corretor esperam um pelo outro, então a checagem de
// conflito do segundo já enxerga o primeiro — sem isso, dois cliques
// simultâneos podiam passar os dois pela checagem e gravar no mesmo horário.
export async function withRealtorScheduleLock<T>(
  realtorId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`agenda:${realtorId}`}))`
    return fn(tx)
  })
}

export async function createAppointmentTx(tx: Prisma.TransactionClient, data: Prisma.AppointmentCreateInput) {
  return tx.appointment.create({ data, include: appointmentInclude })
}

export async function updateAppointmentTx(
  tx: Prisma.TransactionClient,
  id: string,
  data: Prisma.AppointmentUpdateInput
) {
  return tx.appointment.update({ where: { id }, data, include: appointmentInclude })
}

// Conflito = outro compromisso não cancelado do mesmo corretor cuja
// janela [scheduledAt, scheduledAt+duration) se sobrepõe à nova janela.
export async function findConflicts(
  input: {
    realtorId: string
    scheduledAt: Date
    durationMinutes: number
    excludeId?: string
  },
  db: Db = prisma
) {
  const start = input.scheduledAt
  const end = new Date(start.getTime() + input.durationMinutes * 60000)

  const candidates = await db.appointment.findMany({
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
  const todayStart = startOfDayBrazil(now)
  const todayEnd = endOfDayBrazil(now)

  const weekStart = new Date(todayStart)
  weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay())
  const weekEnd = endOfDayBrazil(
    new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
  )

  const [today, week, confirmed, scheduled, done, noShow, canceled, overdueUnconfirmed] = await Promise.all([
    prisma.appointment.count({ where: { ...where, scheduledAt: { gte: todayStart, lte: todayEnd } } }),
    prisma.appointment.count({ where: { ...where, scheduledAt: { gte: weekStart, lte: weekEnd } } }),
    prisma.appointment.count({ where: { ...where, status: "CONFIRMED" } }),
    prisma.appointment.count({ where: { ...where, status: "SCHEDULED" } }),
    // "Comparecimento" ignora o período da view de propósito — um
    // "não compareceu" marcado num compromisso que já passou (fora do
    // período que a view atual mostra, ex: Lista só olha pra frente)
    // some da conta e faz a taxa parecer 100% mesmo tendo falta.
    prisma.appointment.count({ where: { ...where, scheduledAt: undefined, status: "DONE" } }),
    prisma.appointment.count({ where: { ...where, scheduledAt: undefined, status: "NO_SHOW" } }),
    prisma.appointment.count({ where: { ...where, status: "CANCELED" } }),
    // Ignora o período da view atual de propósito (igual "today"/"week"
    // acima) — passou a data e ninguém marcou o que aconteceu, então
    // esse número precisa aparecer sempre, não só quando a pessoa
    // calhar de estar olhando pro período certo.
    prisma.appointment.count({
      where: {
        realtorId: where.realtorId,
        scheduledAt: { lt: todayStart },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
    }),
  ])

  const attendanceBase = done + noShow
  const attendanceRate = attendanceBase > 0 ? Math.round((done / attendanceBase) * 100) : null

  return { today, week, confirmed, pending: scheduled, attendanceRate, canceled, overdueUnconfirmed }
}
