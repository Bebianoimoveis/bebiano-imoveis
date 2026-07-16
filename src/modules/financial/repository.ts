import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

const entryInclude = {
  contract: {
    select: {
      id: true,
      property: { select: { code: true, title: true } },
      client: { select: { name: true } },
    },
  },
} satisfies Prisma.FinancialEntryInclude

export type FinancialEntryListItem = Prisma.FinancialEntryGetPayload<{
  include: typeof entryInclude
}>

export async function listEntries(
  where: Prisma.FinancialEntryWhereInput
): Promise<FinancialEntryListItem[]> {
  return prisma.financialEntry.findMany({
    where,
    include: entryInclude,
    orderBy: { dueDate: "desc" },
  })
}

export async function createEntry(data: Prisma.FinancialEntryCreateInput) {
  return prisma.financialEntry.create({ data, include: entryInclude })
}

export async function markEntryAsPaid(id: string) {
  return prisma.financialEntry.update({
    where: { id },
    data: { paidAt: new Date() },
    include: entryInclude,
  })
}
