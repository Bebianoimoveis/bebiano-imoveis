import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

const attributedRealtorInclude = {
  user: { select: { name: true } },
} satisfies Prisma.RealtorInclude

export type AttributedRealtor = Prisma.RealtorGetPayload<{
  include: typeof attributedRealtorInclude
}>

// Aceita tanto o slug (formato canônico dos links) quanto o id cru do
// corretor (via ?corretor=<id>, um atalho sem depender de slug).
export function findRealtorByReferralCode(code: string): Promise<AttributedRealtor | null> {
  return prisma.realtor.findFirst({
    where: {
      active: true,
      deletedAt: null,
      OR: [{ slug: code }, { id: code }],
    },
    include: attributedRealtorInclude,
  })
}

export function findRealtorById(id: string): Promise<AttributedRealtor | null> {
  return prisma.realtor.findFirst({
    where: { id, active: true, deletedAt: null },
    include: attributedRealtorInclude,
  })
}

export function findOldestActiveRealtor(): Promise<{ id: string } | null> {
  return prisma.realtor.findFirst({
    where: { active: true, deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  })
}

type CreateVisitorAttributionInput = {
  visitorId: string
  realtorId: string
  referralSource: string
  landingUrl: string
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  expiresAt: Date
}

export function createVisitorAttribution(input: CreateVisitorAttributionInput) {
  return prisma.visitorAttribution.create({ data: input })
}

const visitorAttributionInclude = {
  realtor: { include: attributedRealtorInclude },
} satisfies Prisma.VisitorAttributionInclude

export type VisitorAttributionWithRealtor = Prisma.VisitorAttributionGetPayload<{
  include: typeof visitorAttributionInclude
}>

export function findAttributionByVisitorId(
  visitorId: string
): Promise<VisitorAttributionWithRealtor | null> {
  return prisma.visitorAttribution.findUnique({
    where: { visitorId },
    include: visitorAttributionInclude,
  })
}

// Atualização "melhor esforço" — chamada sem await pelo service (não deve
// atrasar a renderização da página por causa de uma métrica).
export function touchLastVisit(visitorId: string) {
  return prisma.visitorAttribution.update({
    where: { visitorId },
    data: { lastVisitAt: new Date() },
  })
}

const realtorLinkStatsInclude = {
  user: { select: { name: true } },
  _count: {
    select: {
      visitorAttributions: true,
      leads: true,
      contracts: { where: { status: { in: ["ACTIVE", "COMPLETED"] } } },
    },
  },
  visitorAttributions: {
    orderBy: { lastVisitAt: "desc" as const },
    take: 1,
    select: { lastVisitAt: true },
  },
} satisfies Prisma.RealtorInclude

export type RealtorLinkStats = Prisma.RealtorGetPayload<{
  include: typeof realtorLinkStatsInclude
}>

// Base pro painel "Links dos Corretores": visitas (visitantes únicos
// atribuídos), leads gerados, vendas (contratos ativos/concluídos) e
// último acesso, por corretor ativo.
export function listRealtorLinkStats(): Promise<RealtorLinkStats[]> {
  return prisma.realtor.findMany({
    where: { active: true, deletedAt: null },
    include: realtorLinkStatsInclude,
    orderBy: { user: { name: "asc" } },
  })
}

type DistributionSettings = {
  id: string
  defaultRealtorId: string | null
  leadDistributionMode: "FIXED" | "ROUND_ROBIN"
  roundRobinLastRealtorId: string | null
}

export function findDistributionSettings(): Promise<DistributionSettings | null> {
  return prisma.siteSettings.findFirst({
    select: {
      id: true,
      defaultRealtorId: true,
      leadDistributionMode: true,
      roundRobinLastRealtorId: true,
    },
  })
}

// Escolhe o próximo corretor ativo da fila (ordem estável por createdAt)
// depois do cursor atual, e já avança o cursor — tudo numa transação para
// não sortear o mesmo corretor duas vezes sob concorrência.
export async function assignNextRoundRobinRealtor(
  settingsId: string,
  currentCursorId: string | null
): Promise<string | null> {
  return prisma.$transaction(async (tx) => {
    const realtors = await tx.realtor.findMany({
      where: { active: true, deletedAt: null },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    })
    if (realtors.length === 0) return null

    const currentIndex = currentCursorId
      ? realtors.findIndex((realtor) => realtor.id === currentCursorId)
      : -1
    const next = realtors[(currentIndex + 1) % realtors.length]

    await tx.siteSettings.update({
      where: { id: settingsId },
      data: { roundRobinLastRealtorId: next.id },
    })

    return next.id
  })
}
