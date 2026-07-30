import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

const entryListInclude = {
  contract: {
    select: {
      id: true,
      property: { select: { code: true, title: true } },
      client: { select: { name: true } },
    },
  },
  client: { select: { id: true, name: true, code: true } },
  realtor: { include: { user: true } },
  property: { select: { id: true, code: true, title: true, city: { select: { name: true, state: true } } } },
} satisfies Prisma.FinancialEntryInclude

const entryDetailInclude = {
  ...entryListInclude,
  interactions: {
    orderBy: { createdAt: "desc" as const },
    include: { user: true },
  },
} satisfies Prisma.FinancialEntryInclude

export type FinancialEntryListItem = Prisma.FinancialEntryGetPayload<{
  include: typeof entryListInclude
}>

export type FinancialEntryDetail = Prisma.FinancialEntryGetPayload<{
  include: typeof entryDetailInclude
}>

export async function listEntries(
  where: Prisma.FinancialEntryWhereInput
): Promise<FinancialEntryListItem[]> {
  return prisma.financialEntry.findMany({
    where,
    include: entryListInclude,
    orderBy: { dueDate: "desc" },
  })
}

export async function findEntryById(id: string): Promise<FinancialEntryDetail | null> {
  return prisma.financialEntry.findUnique({ where: { id }, include: entryDetailInclude })
}

export async function createEntry(data: Prisma.FinancialEntryCreateInput) {
  return prisma.financialEntry.create({ data, include: entryListInclude })
}

export async function updateEntry(id: string, data: Prisma.FinancialEntryUpdateInput) {
  return prisma.financialEntry.update({ where: { id }, data, include: entryListInclude })
}

export async function deleteEntry(id: string) {
  return prisma.financialEntry.delete({ where: { id } })
}

export async function duplicateEntry(id: string) {
  const original = await prisma.financialEntry.findUniqueOrThrow({ where: { id } })
  return prisma.financialEntry.create({
    data: {
      type: original.type,
      category: original.category,
      description: original.description,
      amount: original.amount,
      status: "PENDING",
      paymentMethod: original.paymentMethod,
      notes: original.notes,
      dueDate: original.dueDate,
      contractId: original.contractId,
      clientId: original.clientId,
      realtorId: original.realtorId,
      propertyId: original.propertyId,
    },
    include: entryListInclude,
  })
}

export async function markEntryStatus(
  id: string,
  status: "PAID" | "CANCELED" | "SCHEDULED" | "PENDING",
  paidAmount?: number
) {
  return prisma.financialEntry.update({
    where: { id },
    data: {
      status,
      paidAt: status === "PAID" ? new Date() : null,
      paidAmount: status === "PAID" ? (paidAmount ?? undefined) : undefined,
    },
    include: entryListInclude,
  })
}

export async function createEntryInteraction(input: {
  entryId: string
  userId: string
  type: "CALL" | "WHATSAPP" | "EMAIL" | "VISIT" | "NOTE"
  description: string
}) {
  return prisma.financialEntryInteraction.create({ data: input, include: { user: true } })
}

// ---------------------------------------------------------------------------
// Agregações para KPIs, gráficos e relatórios
// ---------------------------------------------------------------------------

function monthRange(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 1))
  return { gte: start, lt: end }
}

export async function sumByTypeInRange(
  where: Prisma.FinancialEntryWhereInput,
  range: { gte: Date; lt: Date }
) {
  const [income, expense] = await Promise.all([
    prisma.financialEntry.aggregate({
      where: { ...where, type: "INCOME", dueDate: range },
      _sum: { amount: true },
    }),
    prisma.financialEntry.aggregate({
      where: { ...where, type: "EXPENSE", dueDate: range },
      _sum: { amount: true },
    }),
  ])
  return {
    income: Number(income._sum.amount ?? 0),
    expense: Number(expense._sum.amount ?? 0),
  }
}

export async function getKpiData(where: Prisma.FinancialEntryWhereInput) {
  const now = new Date()
  const currentMonth = monthRange(now.getUTCFullYear(), now.getUTCMonth() + 1)
  const prevDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  const previousMonth = monthRange(prevDate.getUTCFullYear(), prevDate.getUTCMonth() + 1)
  const yearRange = {
    gte: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)),
    lt: new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1)),
  }

  const [currentMonthTotals, previousMonthTotals, yearTotals, pendingIncome, pendingExpense, paidCount, paidSum] =
    await Promise.all([
      sumByTypeInRange(where, currentMonth),
      sumByTypeInRange(where, previousMonth),
      sumByTypeInRange(where, yearRange),
      prisma.financialEntry.aggregate({
        where: { ...where, type: "INCOME", status: { in: ["PENDING", "SCHEDULED", "PARTIAL"] } },
        _sum: { amount: true },
      }),
      prisma.financialEntry.aggregate({
        where: { ...where, type: "EXPENSE", status: { in: ["PENDING", "SCHEDULED", "PARTIAL"] } },
        _sum: { amount: true },
      }),
      prisma.financialEntry.count({ where: { ...where, type: "INCOME", status: "PAID" } }),
      prisma.financialEntry.aggregate({
        where: { ...where, type: "INCOME", status: "PAID" },
        _sum: { amount: true },
      }),
    ])

  return {
    currentMonth: currentMonthTotals,
    previousMonth: previousMonthTotals,
    year: yearTotals,
    pendingIncome: Number(pendingIncome._sum.amount ?? 0),
    pendingExpense: Number(pendingExpense._sum.amount ?? 0),
    averageTicket: paidCount > 0 ? Number(paidSum._sum.amount ?? 0) / paidCount : 0,
  }
}

// Últimos `months` meses (incluindo o atual), receita e despesa somadas por dueDate.
export async function getMonthlySeries(where: Prisma.FinancialEntryWhereInput, months = 12) {
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1))

  const entries = await prisma.financialEntry.findMany({
    where: { ...where, dueDate: { gte: start } },
    select: { type: true, amount: true, dueDate: true },
  })

  const buckets = new Map<string, { income: number; expense: number }>()
  for (let i = 0; i < months; i++) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1))
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
    buckets.set(key, { income: 0, expense: 0 })
  }

  for (const entry of entries) {
    const d = entry.dueDate
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
    const bucket = buckets.get(key)
    if (!bucket) continue
    if (entry.type === "INCOME") bucket.income += Number(entry.amount)
    else bucket.expense += Number(entry.amount)
  }

  return Array.from(buckets.entries()).map(([month, totals]) => ({ month, ...totals }))
}

export async function getExpenseByCategory(where: Prisma.FinancialEntryWhereInput) {
  const rows = await prisma.financialEntry.groupBy({
    by: ["category"],
    where: { ...where, type: "EXPENSE" },
    _sum: { amount: true },
  })
  return rows
    .map((row) => ({ category: row.category, total: Number(row._sum.amount ?? 0) }))
    .sort((a, b) => b.total - a.total)
}

export async function getIncomeByRealtor(where: Prisma.FinancialEntryWhereInput) {
  const rows = await prisma.financialEntry.groupBy({
    by: ["realtorId"],
    where: { ...where, type: "INCOME", realtorId: { not: null } },
    _sum: { amount: true },
  })
  const realtorIds = rows.map((row) => row.realtorId).filter((id): id is string => Boolean(id))
  const realtors = await prisma.realtor.findMany({
    where: { id: { in: realtorIds } },
    include: { user: true },
  })
  const nameById = new Map(realtors.map((r) => [r.id, r.user.name]))
  return rows
    .map((row) => ({
      realtorId: row.realtorId as string,
      name: nameById.get(row.realtorId as string) ?? "—",
      total: Number(row._sum.amount ?? 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
}

export async function getIncomeByCity(where: Prisma.FinancialEntryWhereInput) {
  const rows = await prisma.financialEntry.groupBy({
    by: ["propertyId"],
    where: { ...where, type: "INCOME", propertyId: { not: null } },
    _sum: { amount: true },
  })
  const propertyIds = rows.map((row) => row.propertyId).filter((id): id is string => Boolean(id))
  const properties = await prisma.property.findMany({
    where: { id: { in: propertyIds } },
    select: { id: true, city: { select: { name: true } } },
  })
  const cityByProperty = new Map(properties.map((p) => [p.id, p.city.name]))

  const totalsByCity = new Map<string, number>()
  for (const row of rows) {
    const city = cityByProperty.get(row.propertyId as string) ?? "Sem cidade"
    totalsByCity.set(city, (totalsByCity.get(city) ?? 0) + Number(row._sum.amount ?? 0))
  }

  return Array.from(totalsByCity.entries())
    .map(([city, total]) => ({ city, total }))
    .sort((a, b) => b.total - a.total)
}

export async function getTopProperties(where: Prisma.FinancialEntryWhereInput, take = 5) {
  const rows = await prisma.financialEntry.groupBy({
    by: ["propertyId"],
    where: { ...where, type: "INCOME", propertyId: { not: null } },
    _sum: { amount: true },
  })
  const sorted = rows
    .map((row) => ({ propertyId: row.propertyId as string, total: Number(row._sum.amount ?? 0) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, take)

  const properties = await prisma.property.findMany({
    where: { id: { in: sorted.map((r) => r.propertyId) } },
    select: { id: true, code: true, title: true },
  })
  const byId = new Map(properties.map((p) => [p.id, p]))

  return sorted.map((row) => ({
    ...row,
    code: byId.get(row.propertyId)?.code ?? "—",
    title: byId.get(row.propertyId)?.title ?? "—",
  }))
}

// Saldo diário acumulado no mês corrente — base do "Fluxo de Caixa".
export async function getCashFlowTimeline(where: Prisma.FinancialEntryWhereInput) {
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))

  const entries = await prisma.financialEntry.findMany({
    where: { ...where, dueDate: { gte: start, lt: end }, status: { not: "CANCELED" } },
    select: { type: true, amount: true, dueDate: true },
  })

  const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate()
  const perDay = Array.from({ length: daysInMonth }, () => ({ income: 0, expense: 0 }))

  for (const entry of entries) {
    const day = entry.dueDate.getUTCDate() - 1
    if (day < 0 || day >= perDay.length) continue
    if (entry.type === "INCOME") perDay[day].income += Number(entry.amount)
    else perDay[day].expense += Number(entry.amount)
  }

  let running = 0
  return perDay.map((day, index) => {
    running += day.income - day.expense
    return { day: index + 1, income: day.income, expense: day.expense, balance: running }
  })
}

export async function getCommissionsByRealtor() {
  const realtors = await prisma.realtor.findMany({
    where: { active: true },
    include: { user: true },
  })

  const [soldContracts, commissionEntries, pendingCommissionEntries] = await Promise.all([
    prisma.contract.groupBy({
      by: ["realtorId"],
      where: { status: { in: ["ACTIVE", "COMPLETED"] } },
      _sum: { value: true },
    }),
    prisma.financialEntry.groupBy({
      by: ["realtorId"],
      where: { category: "Comissão", type: "INCOME", status: "PAID", realtorId: { not: null } },
      _sum: { amount: true },
    }),
    prisma.financialEntry.groupBy({
      by: ["realtorId"],
      where: {
        category: "Comissão",
        type: "INCOME",
        status: { in: ["PENDING", "SCHEDULED", "PARTIAL"] },
        realtorId: { not: null },
      },
      _sum: { amount: true },
    }),
  ])

  const soldByRealtor = new Map(soldContracts.map((r) => [r.realtorId, Number(r._sum.value ?? 0)]))
  const paidByRealtor = new Map(commissionEntries.map((r) => [r.realtorId, Number(r._sum.amount ?? 0)]))
  const pendingByRealtor = new Map(pendingCommissionEntries.map((r) => [r.realtorId, Number(r._sum.amount ?? 0)]))

  return realtors.map((realtor) => ({
    realtorId: realtor.id,
    name: realtor.user.name,
    photoUrl: realtor.photoUrl,
    soldValue: soldByRealtor.get(realtor.id) ?? 0,
    commissionPaid: paidByRealtor.get(realtor.id) ?? 0,
    commissionPending: pendingByRealtor.get(realtor.id) ?? 0,
  }))
}
