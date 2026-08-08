"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { logActivity } from "@/lib/activity-log"
import type { Prisma, ProposalStatus } from "@/generated/prisma/client"
import {
  proposalFiltersSchema,
  proposalInputSchema,
  proposalInteractionSchema,
} from "@/modules/proposal/schema"
import * as proposalRepository from "@/modules/proposal/repository"

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new Error("Não autenticado.")
  return session
}

async function requireProposalManage() {
  const session = await requireSession()
  if (!(await can(session.user, "proposal.manage"))) {
    throw new Error("Sem permissão para gerenciar propostas.")
  }
  return session
}

async function buildProposalScopeWhere(
  session: Awaited<ReturnType<typeof requireSession>>,
  filters: ReturnType<typeof proposalFiltersSchema.parse>
): Promise<Prisma.ProposalWhereInput> {
  const canViewAll = await can(session.user, "proposal.view.all")

  return {
    status: filters.status,
    realtorId: canViewAll ? filters.realtorId : (session.user.realtorId ?? "__none__"),
    value:
      filters.minValue || filters.maxValue
        ? { gte: filters.minValue, lte: filters.maxValue }
        : undefined,
    createdAt:
      filters.createdFrom || filters.createdTo
        ? { gte: filters.createdFrom, lte: filters.createdTo }
        : undefined,
    property: filters.cityId ? { cityId: filters.cityId } : undefined,
    OR: filters.search
      ? [
          { client: { name: { contains: filters.search, mode: "insensitive" } } },
          { property: { title: { contains: filters.search, mode: "insensitive" } } },
          { property: { code: { contains: filters.search, mode: "insensitive" } } },
          { id: { contains: filters.search, mode: "insensitive" } },
        ]
      : undefined,
  }
}

// Widget "Radar de Prazos" do Dashboard — propostas com validade nos
// próximos `daysAhead` dias, ainda num estágio ativo do funil. Mesma
// definição de "ativa" já usada em getProposalStats (proposal/repository.ts)
// pro cálculo de propostas expiradas.
export async function listAdminProposalsExpiringSoon(daysAhead = 7) {
  const session = await requireSession()
  const canViewAll = await can(session.user, "proposal.view.all")
  const now = new Date()
  const until = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

  return proposalRepository.listProposals({
    realtorId: canViewAll ? undefined : (session.user.realtorId ?? "__none__"),
    validUntil: { gte: now, lte: until },
    status: { notIn: ["ACCEPTED", "REJECTED", "COMPLETED", "CANCELED"] },
  })
}

export async function listAdminProposals(rawFilters: unknown = {}) {
  const session = await requireSession()
  const filters = proposalFiltersSchema.parse(rawFilters ?? {})
  const where = await buildProposalScopeWhere(session, filters)

  return proposalRepository.listProposals(where)
}

export async function getProposalCrmStats(rawFilters: unknown = {}) {
  const session = await requireSession()
  const filters = proposalFiltersSchema.parse(rawFilters ?? {})
  const where = await buildProposalScopeWhere(session, filters)

  return proposalRepository.getProposalStats(where)
}

function toCsvValue(value: string | number) {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export async function exportProposalsCsv(rawFilters: unknown = {}) {
  const session = await requireSession()
  const filters = proposalFiltersSchema.parse(rawFilters ?? {})
  const where = await buildProposalScopeWhere(session, filters)
  const proposals = await proposalRepository.listProposals(where)

  const header = ["Código", "Cliente", "Imóvel", "Corretor", "Valor original", "Valor ofertado", "Status", "Criada em"]
  const rows = proposals.map((proposal) => [
    proposal.id.slice(0, 8).toUpperCase(),
    proposal.client.name,
    `${proposal.property.code} - ${proposal.property.title}`,
    proposal.realtor.user.name,
    proposal.originalValue ? proposal.originalValue.toString() : "",
    proposal.value.toString(),
    proposal.status,
    proposal.createdAt.toLocaleDateString("pt-BR"),
  ])

  return [header, ...rows].map((row) => row.map(toCsvValue).join(",")).join("\n")
}

export async function createProposalWizard(input: unknown) {
  const session = await requireProposalManage()
  const data = proposalInputSchema.parse(input)

  const proposal = await proposalRepository.createProposal({
    value: data.value,
    originalValue: data.originalValue,
    downPayment: data.downPayment,
    financingValue: data.financingValue,
    fgtsValue: data.fgtsValue,
    installments: data.installments,
    installmentValue: data.installmentValue,
    commissionPercent: data.commissionPercent,
    paymentMethod: data.paymentMethod,
    validUntil: data.validUntil,
    notes: data.notes,
    status: data.status ?? "DRAFT",
    property: { connect: { id: data.propertyId } },
    client: { connect: { id: data.clientId } },
    realtor: { connect: { id: data.realtorId } },
    lead: data.leadId ? { connect: { id: data.leadId } } : undefined,
  })

  await logActivity({
    userId: session.user.id,
    action: "proposal.create",
    entityType: "Proposal",
    entityId: proposal.id,
  })

  revalidatePath("/admin/propostas")
  if (data.leadId) revalidatePath(`/admin/leads/${data.leadId}`)
  return { id: proposal.id }
}

// Alias mantido pro nome usado em pontos já existentes do sistema (ex:
// ProposalFormDialog embutido em Lead/Client) — mesmo formulário,
// mesma action.
export const createProposal = createProposalWizard

export async function getAdminProposal(id: string) {
  const session = await requireSession()
  const proposal = await proposalRepository.findProposalById(id)
  if (!proposal) return null

  const canViewAll = await can(session.user, "proposal.view.all")
  if (!canViewAll && proposal.realtorId !== session.user.realtorId) {
    throw new Error("Sem permissão para visualizar esta proposta.")
  }

  return proposal
}

async function assertCanManageProposal(
  session: Awaited<ReturnType<typeof requireSession>>,
  proposalId: string
) {
  if (!(await can(session.user, "proposal.manage"))) {
    throw new Error("Sem permissão para gerenciar propostas.")
  }

  const canViewAll = await can(session.user, "proposal.view.all")
  if (canViewAll) return

  const proposal = await proposalRepository.findProposalById(proposalId)
  if (!proposal || proposal.realtorId !== session.user.realtorId) {
    throw new Error("Sem permissão para gerenciar esta proposta.")
  }
}

export async function updateProposal(id: string, input: unknown) {
  const session = await requireSession()
  await assertCanManageProposal(session, id)

  const data = proposalInputSchema.partial().parse(input)
  await proposalRepository.updateProposal(id, {
    value: data.value,
    originalValue: data.originalValue,
    downPayment: data.downPayment,
    financingValue: data.financingValue,
    fgtsValue: data.fgtsValue,
    installments: data.installments,
    installmentValue: data.installmentValue,
    commissionPercent: data.commissionPercent,
    paymentMethod: data.paymentMethod,
    validUntil: data.validUntil,
    notes: data.notes,
  })

  await logActivity({
    userId: session.user.id,
    action: "proposal.edit",
    entityType: "Proposal",
    entityId: id,
  })

  revalidatePath("/admin/propostas")
  return { id }
}

export async function updateProposalStatus(id: string, status: ProposalStatus) {
  const session = await requireSession()
  await assertCanManageProposal(session, id)

  await proposalRepository.updateProposalStatus(id, status)

  await logActivity({
    userId: session.user.id,
    action: `proposal.status.${status.toLowerCase()}`,
    entityType: "Proposal",
    entityId: id,
  })

  revalidatePath("/admin/propostas")
  return { id }
}

export async function deleteProposal(id: string) {
  const session = await requireSession()
  await assertCanManageProposal(session, id)

  await proposalRepository.deleteProposal(id)

  await logActivity({
    userId: session.user.id,
    action: "proposal.delete",
    entityType: "Proposal",
    entityId: id,
  })

  revalidatePath("/admin/propostas")
}

export async function duplicateProposal(id: string) {
  const session = await requireSession()
  await assertCanManageProposal(session, id)

  const duplicate = await proposalRepository.duplicateProposal(id)

  await logActivity({
    userId: session.user.id,
    action: "proposal.duplicate",
    entityType: "Proposal",
    entityId: duplicate.id,
    metadata: { sourceId: id },
  })

  revalidatePath("/admin/propostas")
  return { id: duplicate.id }
}

export async function addProposalInteraction(proposalId: string, input: unknown) {
  const session = await requireSession()
  await assertCanManageProposal(session, proposalId)

  const data = proposalInteractionSchema.parse(input)
  await proposalRepository.createProposalInteraction({
    proposalId,
    userId: session.user.id,
    type: data.type,
    description: data.description,
  })

  revalidatePath("/admin/propostas")
}

// Marca a proposta como enviada (gera o link público de acompanhamento
// já existente via shareToken, criado na hora da criação) — usado pelo
// botão "Enviar" no drawer/pipeline.
export async function markProposalSent(id: string) {
  const session = await requireSession()
  await assertCanManageProposal(session, id)

  await proposalRepository.updateProposalStatus(id, "SENT")

  await logActivity({
    userId: session.user.id,
    action: "proposal.sent",
    entityType: "Proposal",
    entityId: id,
  })

  revalidatePath("/admin/propostas")
  return { id }
}
