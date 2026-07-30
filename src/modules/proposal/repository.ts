import { randomUUID } from "crypto"

import { prisma } from "@/lib/prisma"
import type { Prisma, ProposalStatus } from "@/generated/prisma/client"

const proposalListInclude = {
  property: {
    select: {
      id: true,
      title: true,
      code: true,
      price: true,
      status: true,
      city: { select: { name: true, state: true } },
      images: { where: { isCover: true }, select: { url: true }, take: 1 },
    },
  },
  client: { select: { id: true, name: true, phone: true, email: true, code: true } },
  realtor: { include: { user: true } },
  contract: { select: { id: true } },
} satisfies Prisma.ProposalInclude

const proposalDetailInclude = {
  ...proposalListInclude,
  property: {
    include: {
      city: { select: { name: true, state: true } },
      neighborhood: { select: { name: true } },
      images: { orderBy: { order: "asc" as const } },
      features: { include: { feature: true } },
    },
  },
  lead: { select: { id: true, name: true, stage: true } },
  contract: true,
  interactions: {
    orderBy: { createdAt: "desc" as const },
    include: { user: true },
  },
} satisfies Prisma.ProposalInclude

export type ProposalListItem = Prisma.ProposalGetPayload<{ include: typeof proposalListInclude }>
export type ProposalDetail = Prisma.ProposalGetPayload<{ include: typeof proposalDetailInclude }>

export async function listProposals(where: Prisma.ProposalWhereInput): Promise<ProposalListItem[]> {
  return prisma.proposal.findMany({
    where,
    include: proposalListInclude,
    orderBy: { createdAt: "desc" },
  })
}

export async function findProposalById(id: string): Promise<ProposalDetail | null> {
  return prisma.proposal.findUnique({ where: { id }, include: proposalDetailInclude })
}

export async function findProposalByShareToken(token: string): Promise<ProposalDetail | null> {
  return prisma.proposal.findUnique({ where: { shareToken: token }, include: proposalDetailInclude })
}

type CreateProposalData = Omit<Prisma.ProposalCreateInput, "shareToken">

export async function createProposal(data: CreateProposalData) {
  return prisma.proposal.create({
    data: { ...data, shareToken: randomUUID() },
    include: proposalListInclude,
  })
}

export async function updateProposal(id: string, data: Prisma.ProposalUpdateInput) {
  return prisma.proposal.update({ where: { id }, data, include: proposalListInclude })
}

export async function updateProposalStatus(id: string, status: ProposalStatus) {
  return prisma.proposal.update({
    where: { id },
    data: {
      status,
      sentAt: status === "SENT" ? new Date() : undefined,
    },
    include: proposalListInclude,
  })
}

// Sem soft-delete (Proposal não tem deletedAt) — mesma decisão já tomada
// pra Appointment: uma proposta errada é removida de verdade, o
// histórico de negócio real fica marcado via status (CANCELED), não via
// exclusão.
export async function deleteProposal(id: string) {
  return prisma.proposal.delete({ where: { id } })
}

export async function duplicateProposal(id: string) {
  const original = await prisma.proposal.findUniqueOrThrow({ where: { id } })
  return prisma.proposal.create({
    data: {
      value: original.value,
      originalValue: original.originalValue,
      downPayment: original.downPayment,
      financingValue: original.financingValue,
      fgtsValue: original.fgtsValue,
      installments: original.installments,
      installmentValue: original.installmentValue,
      commissionPercent: original.commissionPercent,
      paymentMethod: original.paymentMethod,
      notes: original.notes,
      status: "DRAFT",
      propertyId: original.propertyId,
      clientId: original.clientId,
      realtorId: original.realtorId,
      leadId: original.leadId,
      shareToken: randomUUID(),
    },
    include: proposalListInclude,
  })
}

// Marca a primeira visualização de verdade — chamado só pela página
// pública (/proposta/[token]), nunca pelo admin. Idempotente: não
// sobrescreve viewedAt se já existir, e só avança SENT -> VIEWED (não
// regride nenhum outro estágio do funil).
export async function markProposalViewed(id: string, currentStatus: ProposalStatus, alreadyViewed: boolean) {
  return prisma.proposal.update({
    where: { id },
    data: {
      viewedAt: alreadyViewed ? undefined : new Date(),
      status: currentStatus === "SENT" ? "VIEWED" : undefined,
    },
  })
}

export async function getProposalStats(where: Prisma.ProposalWhereInput) {
  const base = where

  const [byStatus, valueAgg, expired] = await Promise.all([
    prisma.proposal.groupBy({ by: ["status"], where: base, _count: true, _sum: { value: true } }),
    prisma.proposal.aggregate({ where: { ...base, status: "COMPLETED" }, _sum: { value: true } }),
    // "Expirada" não é um status guardado — é derivado (prazo vencido e
    // ainda num estágio ativo do funil), pra não inventar um estado sem
    // lastro nenhum além da data de validade já real.
    prisma.proposal.count({
      where: {
        ...base,
        validUntil: { lt: new Date() },
        status: { notIn: ["ACCEPTED", "REJECTED", "COMPLETED", "CANCELED"] },
      },
    }),
  ])

  const countByStatus = Object.fromEntries(byStatus.map((row) => [row.status, row._count])) as Record<
    string,
    number
  >
  const valueByStatus = Object.fromEntries(
    byStatus.map((row) => [row.status, Number(row._sum.value ?? 0)])
  ) as Record<string, number>

  const total = byStatus.reduce((sum, row) => sum + row._count, 0)

  const openStatuses = ["DRAFT", "SENT", "VIEWED"] as const
  const negotiatingValue = valueByStatus.NEGOTIATING ?? 0
  const openValue = openStatuses.reduce((sum, status) => sum + (valueByStatus[status] ?? 0), 0)
  const signingValue = valueByStatus.SIGNING ?? 0

  return {
    open: openStatuses.reduce((sum, status) => sum + (countByStatus[status] ?? 0), 0),
    negotiating: countByStatus.NEGOTIATING ?? 0,
    accepted: countByStatus.ACCEPTED ?? 0,
    rejected: countByStatus.REJECTED ?? 0,
    completed: countByStatus.COMPLETED ?? 0,
    expired,
    totalNegotiatingValue: openValue + negotiatingValue + signingValue + (valueByStatus.ACCEPTED ?? 0),
    closedValue: Number(valueAgg._sum.value ?? 0),
    conversionRate: total > 0 ? Math.round(((countByStatus.COMPLETED ?? 0) / total) * 100) : 0,
  }
}

export async function createProposalInteraction(input: {
  proposalId: string
  userId: string
  type: "CALL" | "WHATSAPP" | "EMAIL" | "VISIT" | "NOTE"
  description: string
}) {
  return prisma.proposalInteraction.create({ data: input, include: { user: true } })
}
