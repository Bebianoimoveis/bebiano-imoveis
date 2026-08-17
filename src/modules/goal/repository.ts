import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

const goalInclude = {
  realtor: { include: { user: true } },
  city: true,
} satisfies Prisma.GoalInclude

export type GoalWithRefs = Prisma.GoalGetPayload<{ include: typeof goalInclude }>

export async function listGoals(year: number): Promise<GoalWithRefs[]> {
  return prisma.goal.findMany({
    where: { year },
    include: goalInclude,
    orderBy: [{ scope: "asc" }, { month: "asc" }],
  })
}

// Evita duplicidade de meta pro mesmo escopo/período/alvo/métrica (ver
// decisão no schema: sem @@unique porque NULL não é único no Postgres pra
// realtorId/cityId — a checagem acontece aqui, na camada de aplicação).
// metric entra na busca pra permitir meta de faturamento E de quantidade
// de vendas coexistindo no mesmo escopo/período sem uma sobrescrever a
// outra.
export async function upsertGoal(data: {
  scope: "COMPANY" | "REALTOR" | "CITY"
  metric: "REVENUE" | "SALES_COUNT"
  year: number
  month?: number
  targetAmount: number
  realtorId?: string
  cityId?: string
}) {
  const existing = await prisma.goal.findFirst({
    where: {
      scope: data.scope,
      metric: data.metric,
      year: data.year,
      month: data.month ?? null,
      realtorId: data.realtorId ?? null,
      cityId: data.cityId ?? null,
    },
  })

  if (existing) {
    return prisma.goal.update({
      where: { id: existing.id },
      data: { targetAmount: data.targetAmount },
      include: goalInclude,
    })
  }

  return prisma.goal.create({
    data: {
      scope: data.scope,
      metric: data.metric,
      year: data.year,
      month: data.month,
      targetAmount: data.targetAmount,
      realtorId: data.realtorId,
      cityId: data.cityId,
    },
    include: goalInclude,
  })
}

export async function deleteGoal(id: string) {
  return prisma.goal.delete({ where: { id } })
}

// Realizado no período da meta, no mesmo recorte de escopo — base da
// barra de progresso. REVENUE soma receitas recebidas; SALES_COUNT conta
// contratos ativos/concluídos (mesma definição de "venda" já usada no
// dashboard, ver report/repository.ts sumSalesInPeriod).
export async function getRealizedForGoal(goal: {
  scope: "COMPANY" | "REALTOR" | "CITY"
  metric: "REVENUE" | "SALES_COUNT"
  year: number
  month: number | null
  realtorId: string | null
  cityId: string | null
}) {
  const start = goal.month
    ? new Date(Date.UTC(goal.year, goal.month - 1, 1))
    : new Date(Date.UTC(goal.year, 0, 1))
  const end = goal.month
    ? new Date(Date.UTC(goal.year, goal.month, 1))
    : new Date(Date.UTC(goal.year + 1, 0, 1))

  if (goal.metric === "SALES_COUNT") {
    const count = await prisma.contract.count({
      where: {
        status: { in: ["ACTIVE", "COMPLETED"] },
        createdAt: { gte: start, lt: end },
        realtorId: goal.scope === "REALTOR" ? (goal.realtorId ?? undefined) : undefined,
        property: goal.scope === "CITY" ? { cityId: goal.cityId ?? undefined } : undefined,
      },
    })
    return count
  }

  const where: Prisma.FinancialEntryWhereInput = {
    type: "INCOME",
    status: "PAID",
    dueDate: { gte: start, lt: end },
    realtorId: goal.scope === "REALTOR" ? (goal.realtorId ?? undefined) : undefined,
    property: goal.scope === "CITY" ? { cityId: goal.cityId ?? undefined } : undefined,
  }

  const result = await prisma.financialEntry.aggregate({ where, _sum: { amount: true } })
  return Number(result._sum.amount ?? 0)
}
