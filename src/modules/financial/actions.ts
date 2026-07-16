"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { logActivity } from "@/lib/activity-log"
import type { Prisma } from "@/generated/prisma/client"
import {
  financialEntryInputSchema,
  financialFiltersSchema,
} from "@/modules/financial/schema"
import * as financialRepository from "@/modules/financial/repository"

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new Error("Não autenticado.")
  return session
}

async function requireFinancialView() {
  const session = await requireSession()
  if (!(await can(session.user, "financial.view"))) {
    throw new Error("Sem permissão para acessar o financeiro.")
  }
  return session
}

async function requireFinancialManage() {
  const session = await requireSession()
  if (!(await can(session.user, "financial.manage"))) {
    throw new Error("Sem permissão para gerenciar o financeiro.")
  }
  return session
}

export async function listAdminFinancialEntries(rawFilters: unknown) {
  await requireFinancialView()
  const filters = financialFiltersSchema.parse(rawFilters ?? {})

  const where: Prisma.FinancialEntryWhereInput = {
    type: filters.type,
    paidAt:
      filters.paid === "true"
        ? { not: null }
        : filters.paid === "false"
          ? null
          : undefined,
    dueDate:
      filters.from || filters.to
        ? { gte: filters.from, lte: filters.to }
        : undefined,
  }

  return financialRepository.listEntries(where)
}

export async function createFinancialEntry(input: unknown) {
  const session = await requireFinancialManage()
  const data = financialEntryInputSchema.parse(input)

  const entry = await financialRepository.createEntry({
    type: data.type,
    category: data.category,
    amount: data.amount,
    dueDate: data.dueDate,
    contract: data.contractId ? { connect: { id: data.contractId } } : undefined,
  })

  await logActivity({
    userId: session.user.id,
    action: "financial.create",
    entityType: "FinancialEntry",
    entityId: entry.id,
  })

  revalidatePath("/admin/financeiro")
  // `amount` é Decimal — não devolver o objeto Prisma inteiro ao client.
  return { id: entry.id }
}

export async function markFinancialEntryAsPaid(id: string) {
  const session = await requireFinancialManage()
  await financialRepository.markEntryAsPaid(id)

  await logActivity({
    userId: session.user.id,
    action: "financial.mark_paid",
    entityType: "FinancialEntry",
    entityId: id,
  })

  revalidatePath("/admin/financeiro")
}
