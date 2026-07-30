"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { logActivity } from "@/lib/activity-log"
import type { Prisma } from "@/generated/prisma/client"
import {
  financialEntryInputSchema,
  financialEntryInteractionSchema,
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

function buildEntryWhere(filters: ReturnType<typeof financialFiltersSchema.parse>): Prisma.FinancialEntryWhereInput {
  return {
    type: filters.type,
    status: filters.status,
    category: filters.category,
    paymentMethod: filters.paymentMethod,
    realtorId: filters.realtorId,
    property: filters.cityId ? { cityId: filters.cityId } : undefined,
    dueDate:
      filters.from || filters.to
        ? { gte: filters.from, lte: filters.to }
        : undefined,
    OR: filters.search
      ? [
          { category: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
          { client: { name: { contains: filters.search, mode: "insensitive" } } },
          { realtor: { user: { name: { contains: filters.search, mode: "insensitive" } } } },
          { property: { title: { contains: filters.search, mode: "insensitive" } } },
        ]
      : undefined,
  }
}

export async function listAdminFinancialEntries(rawFilters: unknown) {
  await requireFinancialView()
  const filters = financialFiltersSchema.parse(rawFilters ?? {})
  return financialRepository.listEntries(buildEntryWhere(filters))
}

export async function getFinancialKpis(rawFilters: unknown = {}) {
  await requireFinancialView()
  const filters = financialFiltersSchema.parse(rawFilters ?? {})
  return financialRepository.getKpiData(buildEntryWhere(filters))
}

export async function getFinancialMonthlySeries(rawFilters: unknown = {}) {
  await requireFinancialView()
  const filters = financialFiltersSchema.parse(rawFilters ?? {})
  return financialRepository.getMonthlySeries(buildEntryWhere(filters))
}

export async function getFinancialExpenseByCategory(rawFilters: unknown = {}) {
  await requireFinancialView()
  const filters = financialFiltersSchema.parse(rawFilters ?? {})
  return financialRepository.getExpenseByCategory(buildEntryWhere(filters))
}

export async function getFinancialIncomeByRealtor(rawFilters: unknown = {}) {
  await requireFinancialView()
  const filters = financialFiltersSchema.parse(rawFilters ?? {})
  return financialRepository.getIncomeByRealtor(buildEntryWhere(filters))
}

export async function getFinancialIncomeByCity(rawFilters: unknown = {}) {
  await requireFinancialView()
  const filters = financialFiltersSchema.parse(rawFilters ?? {})
  return financialRepository.getIncomeByCity(buildEntryWhere(filters))
}

export async function getFinancialTopProperties(rawFilters: unknown = {}) {
  await requireFinancialView()
  const filters = financialFiltersSchema.parse(rawFilters ?? {})
  return financialRepository.getTopProperties(buildEntryWhere(filters))
}

export async function getFinancialCashFlowTimeline(rawFilters: unknown = {}) {
  await requireFinancialView()
  const filters = financialFiltersSchema.parse(rawFilters ?? {})
  return financialRepository.getCashFlowTimeline(buildEntryWhere(filters))
}

export async function getFinancialCommissionsByRealtor() {
  await requireFinancialView()
  return financialRepository.getCommissionsByRealtor()
}

function toCsvValue(value: string | number) {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export async function exportFinancialEntriesCsv(rawFilters: unknown = {}) {
  await requireFinancialView()
  const filters = financialFiltersSchema.parse(rawFilters ?? {})
  const entries = await financialRepository.listEntries(buildEntryWhere(filters))

  const header = [
    "Tipo", "Categoria", "Descrição", "Cliente", "Corretor", "Imóvel",
    "Valor", "Vencimento", "Status", "Forma de pagamento",
  ]
  const rows = entries.map((entry) => [
    entry.type === "INCOME" ? "Receita" : "Despesa",
    entry.category,
    entry.description ?? "",
    entry.client?.name ?? entry.contract?.client?.name ?? "",
    entry.realtor?.user.name ?? "",
    entry.property ? `${entry.property.code} - ${entry.property.title}` : "",
    entry.amount.toString(),
    entry.dueDate.toLocaleDateString("pt-BR"),
    entry.status,
    entry.paymentMethod ?? "",
  ])

  return [header, ...rows].map((row) => row.map(toCsvValue).join(",")).join("\n")
}

export async function createFinancialEntry(input: unknown) {
  const session = await requireFinancialManage()
  const data = financialEntryInputSchema.parse(input)

  const entry = await financialRepository.createEntry({
    type: data.type,
    category: data.category,
    description: data.description,
    amount: data.amount,
    paidAmount: data.paidAmount,
    status: data.status,
    paymentMethod: data.paymentMethod,
    notes: data.notes,
    attachmentUrl: data.attachmentUrl,
    attachmentName: data.attachmentName,
    dueDate: data.dueDate,
    paidAt: data.status === "PAID" ? (data.paidAt ?? new Date()) : undefined,
    contract: data.contractId ? { connect: { id: data.contractId } } : undefined,
    client: data.clientId ? { connect: { id: data.clientId } } : undefined,
    realtor: data.realtorId ? { connect: { id: data.realtorId } } : undefined,
    property: data.propertyId ? { connect: { id: data.propertyId } } : undefined,
  })

  await logActivity({
    userId: session.user.id,
    action: "financial.create",
    entityType: "FinancialEntry",
    entityId: entry.id,
  })

  revalidatePath("/admin/financeiro")
  // amount/paidAmount são Decimal — não devolver o objeto Prisma inteiro ao client.
  return { id: entry.id }
}

export async function updateFinancialEntry(id: string, input: unknown) {
  const session = await requireFinancialManage()
  const data = financialEntryInputSchema.partial().parse(input)

  await financialRepository.updateEntry(id, {
    category: data.category,
    description: data.description,
    amount: data.amount,
    paidAmount: data.paidAmount,
    status: data.status,
    paymentMethod: data.paymentMethod,
    notes: data.notes,
    attachmentUrl: data.attachmentUrl,
    attachmentName: data.attachmentName,
    dueDate: data.dueDate,
    paidAt: data.status === "PAID" ? (data.paidAt ?? new Date()) : data.status ? null : undefined,
    contract: data.contractId ? { connect: { id: data.contractId } } : undefined,
    client: data.clientId ? { connect: { id: data.clientId } } : data.clientId === "" ? { disconnect: true } : undefined,
    realtor: data.realtorId ? { connect: { id: data.realtorId } } : data.realtorId === "" ? { disconnect: true } : undefined,
    property: data.propertyId ? { connect: { id: data.propertyId } } : data.propertyId === "" ? { disconnect: true } : undefined,
  })

  await logActivity({
    userId: session.user.id,
    action: "financial.edit",
    entityType: "FinancialEntry",
    entityId: id,
  })

  revalidatePath("/admin/financeiro")
  return { id }
}

export async function markFinancialEntryStatus(
  id: string,
  status: "PAID" | "CANCELED" | "SCHEDULED" | "PENDING",
  paidAmount?: number
) {
  const session = await requireFinancialManage()
  await financialRepository.markEntryStatus(id, status, paidAmount)

  await logActivity({
    userId: session.user.id,
    action: `financial.status.${status.toLowerCase()}`,
    entityType: "FinancialEntry",
    entityId: id,
  })

  revalidatePath("/admin/financeiro")
}

// Alias mantido pro nome usado no fluxo de criação simples já existente.
export async function markFinancialEntryAsPaid(id: string) {
  return markFinancialEntryStatus(id, "PAID")
}

export async function deleteFinancialEntry(id: string) {
  const session = await requireFinancialManage()
  await financialRepository.deleteEntry(id)

  await logActivity({
    userId: session.user.id,
    action: "financial.delete",
    entityType: "FinancialEntry",
    entityId: id,
  })

  revalidatePath("/admin/financeiro")
}

export async function duplicateFinancialEntry(id: string) {
  const session = await requireFinancialManage()
  const duplicate = await financialRepository.duplicateEntry(id)

  await logActivity({
    userId: session.user.id,
    action: "financial.duplicate",
    entityType: "FinancialEntry",
    entityId: duplicate.id,
    metadata: { sourceId: id },
  })

  revalidatePath("/admin/financeiro")
  return { id: duplicate.id }
}

export async function getAdminFinancialEntry(id: string) {
  await requireFinancialView()
  return financialRepository.findEntryById(id)
}

export async function addFinancialEntryInteraction(entryId: string, input: unknown) {
  const session = await requireFinancialManage()
  const data = financialEntryInteractionSchema.parse(input)

  await financialRepository.createEntryInteraction({
    entryId,
    userId: session.user.id,
    type: data.type,
    description: data.description,
  })

  revalidatePath("/admin/financeiro")
}
