import { prisma } from "@/lib/prisma"
import type { Prisma, LeadStage } from "@/generated/prisma/client"
import { LEAD_STAGES } from "@/modules/lead/schema"

type TransactionClient = Prisma.TransactionClient

const leadListInclude = {
  property: {
    select: {
      id: true,
      title: true,
      code: true,
      slug: true,
      price: true,
      city: { select: { name: true } },
    },
  },
  realtor: { include: { user: true } },
  client: true,
} satisfies Prisma.LeadInclude

const leadDetailInclude = {
  ...leadListInclude,
  interactions: {
    orderBy: { createdAt: "desc" as const },
    include: { user: true },
  },
  appointments: {
    orderBy: { scheduledAt: "desc" as const },
  },
  proposals: {
    orderBy: { createdAt: "desc" as const },
  },
} satisfies Prisma.LeadInclude

export type LeadListItem = Prisma.LeadGetPayload<{ include: typeof leadListInclude }>
export type LeadDetail = Prisma.LeadGetPayload<{ include: typeof leadDetailInclude }>

// Corretor responsável e rastro de origem já resolvidos pelo chamador
// (ver src/modules/attribution/service.ts) — este módulo não decide mais
// qual corretor atribuir, só grava o resultado. Mantém a cadeia de
// prioridade (atribuição do visitante → corretor do imóvel → padrão/
// round-robin → mais antigo) num único lugar, em vez de espalhada entre
// os formulários que criam leads.
export type LeadAttributionInput = {
  realtorId: string | null
  visitorId?: string | null
  referralSource?: string | null
  landingUrl?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
}

type CreateContactRequestInput = {
  name: string
  phone: string
  email?: string
  message?: string
  propertyId?: string
  source: string
  ipAddress?: string
  attribution: LeadAttributionInput
}

function stageRank(stage: LeadStage): number {
  const index = LEAD_STAGES.indexOf(stage)
  return index === -1 ? 0 : index
}

type UpsertLeadByPhoneInput = {
  name: string
  phone: string
  email?: string
  propertyId?: string
  note: string
  // Estágio do lead quando ele é criado pela primeira vez.
  initialStage: LeadStage
  // Se já existir um lead com esse telefone, só avança o estágio dele
  // para este valor — nunca "recua" um lead que já está mais adiante
  // no funil (ex: não regride de "Proposta" pra "Primeiro contato" só
  // porque a pessoa mandou outra mensagem de contato).
  advanceToStage: LeadStage
  attribution: LeadAttributionInput
}

// Núcleo da deduplicação de leads: qualquer formulário público (contato,
// visita) passa por aqui em vez de criar um Lead direto. Sem isso, a
// mesma pessoa preenchendo dois formulários diferentes (ou o mesmo duas
// vezes) virava dois cards separados no Kanban — mesmo telefone, leads
// duplicados. Casamos por telefone (dígitos, sem formatação) em vez de
// pedir login/conta, que derrubaria a taxa de conversão do site.
export async function upsertLeadByPhone(
  tx: TransactionClient,
  input: UpsertLeadByPhoneInput
) {
  const digits = input.phone.replace(/\D/g, "")
  const existing = digits
    ? await tx.lead.findFirst({
        where: { phone: { contains: digits }, deletedAt: null },
        orderBy: { createdAt: "desc" },
      })
    : null

  if (!existing) {
    const lead = await tx.lead.create({
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        origin: "site",
        stage: input.initialStage,
        notes: input.note,
        propertyId: input.propertyId,
        realtorId: input.attribution.realtorId,
        visitorId: input.attribution.visitorId ?? null,
        referralSource: input.attribution.referralSource ?? null,
        landingUrl: input.attribution.landingUrl ?? null,
        utmSource: input.attribution.utmSource ?? null,
        utmMedium: input.attribution.utmMedium ?? null,
        utmCampaign: input.attribution.utmCampaign ?? null,
      },
    })
    return { lead, isNew: true }
  }

  const shouldAdvanceStage = stageRank(input.advanceToStage) > stageRank(existing.stage)

  const lead = await tx.lead.update({
    where: { id: existing.id },
    data: {
      notes: existing.notes ? `${existing.notes}\n\n${input.note}` : input.note,
      lastInteractionAt: new Date(),
      stage: shouldAdvanceStage ? input.advanceToStage : undefined,
      propertyId: existing.propertyId ?? input.propertyId,
      email: existing.email ?? (input.email || null),
    },
  })
  return { lead, isNew: false }
}

// Cria o registro bruto do formulário (auditoria/anti-spam) e o Lead
// correspondente no CRM em uma única transação — o núcleo do fluxo
// "visitante manda mensagem → vira lead automaticamente".
export async function createContactRequestWithLead(
  input: CreateContactRequestInput
) {
  return prisma.$transaction(async (tx) => {
    const contactRequest = await tx.contactRequest.create({
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        message: input.message || null,
        propertyId: input.propertyId,
        source: input.source,
        ipAddress: input.ipAddress,
      },
    })

    const now = new Date().toLocaleString("pt-BR")
    const { lead, isNew } = await upsertLeadByPhone(tx, {
      name: input.name,
      phone: input.phone,
      email: input.email,
      propertyId: input.propertyId,
      note: input.message
        ? `[${now}] Mensagem pelo site: ${input.message}`
        : `[${now}] Novo contato pelo site.`,
      initialStage: "NEW",
      advanceToStage: "FIRST_CONTACT",
      attribution: input.attribution,
    })

    return { contactRequest, lead, isNewLead: isNew }
  })
}

export async function listLeads(
  where: Prisma.LeadWhereInput
): Promise<LeadListItem[]> {
  return prisma.lead.findMany({
    where: { ...where, deletedAt: null },
    include: leadListInclude,
    orderBy: { createdAt: "desc" },
  })
}

export async function findLeadById(id: string): Promise<LeadDetail | null> {
  return prisma.lead.findFirst({
    where: { id, deletedAt: null },
    include: leadDetailInclude,
  })
}

export async function updateLeadStage(id: string, stage: LeadStage) {
  const now = new Date()
  return prisma.lead.update({
    where: { id },
    // stageChangedAt só existe pra dar base real a "tempo no estágio" no
    // card — atualiza toda vez que o estágio muda de verdade, inclusive
    // pelo drag-and-drop do Kanban.
    data: { stage, lastInteractionAt: now, stageChangedAt: now },
    include: leadDetailInclude,
  })
}

export async function softDeleteLead(id: string) {
  return prisma.lead.update({ where: { id }, data: { deletedAt: new Date() } })
}

type CreateLeadManuallyInput = {
  name: string
  phone: string
  email?: string
  origin: string
  propertyId?: string
  realtorId?: string
  temperature: "HOT" | "WARM" | "COLD"
  vip: boolean
  createdById: string
}

export async function createLeadManually(input: CreateLeadManuallyInput) {
  return prisma.lead.create({
    data: {
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      origin: input.origin,
      propertyId: input.propertyId,
      realtorId: input.realtorId,
      temperature: input.temperature,
      vip: input.vip,
      createdById: input.createdById,
    },
    include: leadListInclude,
  })
}

// Só os ids/nomes que casam com o filtro — usado pra agregar métricas
// (valor total do funil) sem arrastar o include pesado da listagem.
export async function listLeadIds(where: Prisma.LeadWhereInput) {
  const rows = await prisma.lead.findMany({
    where: { ...where, deletedAt: null },
    select: { id: true },
  })
  return rows.map((row) => row.id)
}

export async function suggestLeads(where: Prisma.LeadWhereInput, take: number) {
  return prisma.lead.findMany({
    where: { ...where, deletedAt: null },
    select: { id: true, name: true, phone: true },
    orderBy: { createdAt: "desc" },
    take,
  })
}

// Contrato ligado ao lead via a proposta aceita (um lead pode ter várias
// propostas — só a aceita tem contrato de verdade).
export async function findAcceptedContractByLead(leadId: string) {
  return prisma.contract.findFirst({
    where: { proposal: { leadId, status: "ACCEPTED" } },
    include: { proposal: true },
  })
}

// KPIs do topo do CRM. `tempoMedio` é uma aproximação honesta (não existe
// timestamp de "fechado em" — usamos lastInteractionAt dos leads
// CLOSED como proxy do momento em que o funil parou de se mover).
export async function getLeadStats(
  where: Prisma.LeadWhereInput,
  periodFrom: Date,
  appointmentWhere: Prisma.AppointmentWhereInput
) {
  const base = { ...where, deletedAt: null }
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const [byStage, newInPeriod, closedForAvg, visitsToday, openProposals] = await Promise.all([
    prisma.lead.groupBy({ by: ["stage"], where: base, _count: true }),
    prisma.lead.count({ where: { ...base, createdAt: { gte: periodFrom } } }),
    prisma.lead.findMany({
      where: { ...base, stage: "CLOSED" },
      select: { createdAt: true, lastInteractionAt: true },
    }),
    prisma.appointment.count({
      where: { ...appointmentWhere, scheduledAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.proposal.count({
      where: { lead: base, status: { notIn: ["ACCEPTED", "REJECTED", "COMPLETED", "CANCELED"] } },
    }),
  ])

  const countByStage = Object.fromEntries(byStage.map((row) => [row.stage, row._count])) as Record<
    string,
    number
  >
  const total = byStage.reduce((sum, row) => sum + row._count, 0)

  const avgDaysToClose =
    closedForAvg.length > 0
      ? closedForAvg.reduce(
          (sum, lead) => sum + (lead.lastInteractionAt.getTime() - lead.createdAt.getTime()),
          0
        ) /
        closedForAvg.length /
        (1000 * 60 * 60 * 24)
      : null

  return { total, countByStage, newInPeriod, visitsToday, openProposals, avgDaysToClose }
}

export async function updateLead(id: string, data: Prisma.LeadUpdateInput) {
  return prisma.lead.update({
    where: { id },
    data: { ...data, lastInteractionAt: new Date() },
    include: leadDetailInclude,
  })
}

export async function createLeadInteraction(input: {
  leadId: string
  userId: string
  type: "CALL" | "WHATSAPP" | "EMAIL" | "VISIT" | "NOTE"
  description: string
}) {
  return prisma.$transaction([
    prisma.leadInteraction.create({ data: input }),
    prisma.lead.update({
      where: { id: input.leadId },
      data: { lastInteractionAt: new Date() },
    }),
  ])
}
