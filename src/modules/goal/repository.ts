import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"
import { brazilDateOnly, brazilDayWindow } from "@/lib/date"

const goalInclude = {
  realtor: { include: { user: true } },
  city: true,
} satisfies Prisma.GoalInclude

export type GoalWithRefs = Prisma.GoalGetPayload<{ include: typeof goalInclude }>

// Metas cujo período encosta em [from, to] (datas "só dia").
// `onlyRealtorId`: só as metas individuais daquele corretor (visão do
// próprio corretor — nada da empresa nem dos colegas).
export async function listGoalsOverlapping(
  from: Date,
  to: Date,
  onlyRealtorId?: string
): Promise<GoalWithRefs[]> {
  return prisma.goal.findMany({
    where: {
      startDate: { lte: to },
      endDate: { gte: from },
      ...(onlyRealtorId ? { scope: "REALTOR" as const, realtorId: onlyRealtorId } : {}),
    },
    include: goalInclude,
    orderBy: [{ scope: "asc" }, { startDate: "asc" }, { createdAt: "asc" }],
  })
}

export type GoalWriteData = {
  title: string | null
  scope: "COMPANY" | "REALTOR" | "CITY"
  metric: "REVENUE" | "SALES_VALUE" | "SALES_COUNT"
  period: "MONTH" | "QUARTER" | "YEAR" | "YEAR_TO_MONTH" | "MONTHLY" | "CUSTOM"
  startDate: Date
  endDate: Date
  year: number
  month: number | null
  targetAmount: number
  realtorId: string | null
  cityId: string | null
}

export async function createGoal(data: GoalWriteData) {
  return prisma.goal.create({ data })
}

export async function updateGoal(id: string, data: GoalWriteData) {
  return prisma.goal.update({ where: { id }, data })
}

export async function deleteGoal(id: string) {
  return prisma.goal.delete({ where: { id } })
}

// "Eventos" que alimentam o realizado das metas, já com o dia (em
// Brasília) em que contam. Buscados uma vez pro intervalo inteiro e
// distribuídos em memória entre as metas — são poucas dezenas de
// contratos/receitas por mês, não compensa uma consulta por meta/mês.
export type GoalEvent = { day: Date; amount: number; realtorId: string | null; cityId: string | null }

// Venda = contrato ativo ou concluído, contado pela data de cadastro
// (mesma definição do painel, ver report/repository.ts sumSalesInPeriod).
export async function listSaleEvents(from: Date, to: Date): Promise<GoalEvent[]> {
  const contracts = await prisma.contract.findMany({
    where: {
      status: { in: ["ACTIVE", "COMPLETED"] },
      createdAt: { gte: brazilDayWindow(from).from, lte: brazilDayWindow(to).to },
    },
    select: { createdAt: true, value: true, realtorId: true, property: { select: { cityId: true } } },
  })
  return contracts.map((contract) => ({
    day: brazilDateOnly(contract.createdAt),
    amount: Number(contract.value),
    realtorId: contract.realtorId,
    cityId: contract.property.cityId,
  }))
}

// Faturamento = receita marcada como recebida, pelo vencimento.
export async function listRevenueEvents(from: Date, to: Date): Promise<GoalEvent[]> {
  const entries = await prisma.financialEntry.findMany({
    where: { type: "INCOME", status: "PAID", dueDate: { gte: from, lte: to } },
    select: { dueDate: true, amount: true, realtorId: true, property: { select: { cityId: true } } },
  })
  return entries.map((entry) => ({
    day: entry.dueDate,
    amount: Number(entry.amount),
    realtorId: entry.realtorId,
    cityId: entry.property?.cityId ?? null,
  }))
}
