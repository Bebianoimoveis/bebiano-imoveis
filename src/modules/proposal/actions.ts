"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { logActivity } from "@/lib/activity-log"
import { serializeDecimals } from "@/lib/serialize"
import type { Prisma, ProposalStatus } from "@/generated/prisma/client"
import {
  proposalFiltersSchema,
  proposalInputSchema,
  proposalInteractionSchema,
} from "@/modules/proposal/schema"
import { paymentFields } from "@/modules/proposal/payment"
import * as proposalRepository from "@/modules/proposal/repository"
import * as contractRepository from "@/modules/contract/repository"
import { brazilDateOnly, brazilDayWindow } from "@/lib/date"
import { formatDateBR } from "@/lib/format"
import { prisma } from "@/lib/prisma"
import { UserError } from "@/lib/user-error"
import { toCsvValue } from "@/lib/csv"

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new UserError("Não autenticado.")
  return session
}

async function requireProposalManage() {
  const session = await requireSession()
  if (!(await can(session.user, "proposal.manage"))) {
    throw new UserError("Sem permissão para gerenciar propostas.")
  }
  return session
}

async function buildProposalScopeWhere(
  session: Awaited<ReturnType<typeof requireSession>>,
  filters: ReturnType<typeof proposalFiltersSchema.parse>
): Promise<Prisma.ProposalWhereInput> {
  const canViewAll = await can(session.user, "proposal.view.all")

  const expiringUntil = filters.expiringDays
    ? new Date(brazilDateOnly().getTime() + filters.expiringDays * 24 * 60 * 60 * 1000)
    : null

  return {
    status: filters.status ?? (expiringUntil ? { notIn: ["ACCEPTED", "REJECTED", "COMPLETED", "CANCELED"] } : undefined),
    validUntil: expiringUntil ? { gte: brazilDateOnly(), lte: expiringUntil } : undefined,
    realtorId: canViewAll ? filters.realtorId : (session.user.realtorId ?? "__none__"),
    value:
      filters.minValue || filters.maxValue
        ? { gte: filters.minValue, lte: filters.maxValue }
        : undefined,
    // createdFrom/createdTo vêm de <input type="date"> (dia puro, meia-noite
    // UTC); createdAt tem hora de verdade. Converte pro dia inteiro em
    // Brasília — senão "até 31/10" deixava de fora tudo criado no próprio dia
    // 31 e "de 01/11" puxava as últimas 3h de 31/10.
    createdAt:
      filters.createdFrom || filters.createdTo
        ? {
            gte: filters.createdFrom ? brazilDayWindow(filters.createdFrom).from : undefined,
            lte: filters.createdTo ? brazilDayWindow(filters.createdTo).to : undefined,
          }
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
  // validUntil é dia puro: a que vence hoje ainda vale.
  const now = brazilDateOnly()
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
    formatDateBR(proposal.createdAt),
  ])

  return [header, ...rows].map((row) => row.map(toCsvValue).join(",")).join("\n")
}

// Só os campos que a forma de pagamento usa; o resto vai como null.
// Mesma regra da tela (paymentFields), garantida no servidor.
function paymentData(
  method: string,
  data: {
    downPayment?: number
    financingValue?: number
    fgtsValue?: number
    installments?: number
    installmentValue?: number
  }
) {
  const fields = paymentFields(method)
  return {
    downPayment: fields.downPayment ? (data.downPayment ?? null) : null,
    financingValue: fields.financing ? (data.financingValue ?? null) : null,
    fgtsValue: fields.fgts ? (data.fgtsValue ?? null) : null,
    installments: fields.installments ? (data.installments ?? null) : null,
    installmentValue: fields.installments ? (data.installmentValue ?? null) : null,
  }
}

// Corretor fixo da proposta pra quem só cria em nome próprio; null = livre.
export async function getProposalRealtorLock(): Promise<string | null> {
  const session = await requireSession()
  if (await can(session.user, "proposal.view.all")) return null
  return session.user.realtorId
}

export async function createProposalWizard(input: unknown) {
  const session = await requireProposalManage()
  const data = proposalInputSchema.parse(input)

  // Quem não vê tudo cria sempre em nome próprio e só com cliente/lead seu.
  let realtorId = data.realtorId
  if (!(await can(session.user, "proposal.view.all"))) {
    if (!session.user.realtorId) throw new UserError("Sua conta não está ligada a um corretor.")
    realtorId = session.user.realtorId

    const [client, lead] = await Promise.all([
      prisma.client.findFirst({ where: { id: data.clientId, deletedAt: null }, select: { realtorId: true } }),
      data.leadId
        ? prisma.lead.findFirst({ where: { id: data.leadId, deletedAt: null }, select: { realtorId: true } })
        : null,
    ])
    if (client?.realtorId !== realtorId) throw new UserError("Este cliente é de outro corretor.")
    if (data.leadId && lead?.realtorId !== realtorId) throw new UserError("Este lead é de outro corretor.")
  }

  const proposal = await proposalRepository.createProposal({
    value: data.value,
    originalValue: data.originalValue,
    ...paymentData(data.paymentMethod ?? "", data),
    commissionPercent: data.commissionPercent,
    paymentMethod: data.paymentMethod,
    validUntil: data.validUntil,
    notes: data.notes,
    status: data.status ?? "DRAFT",
    property: { connect: { id: data.propertyId } },
    client: { connect: { id: data.clientId } },
    realtor: { connect: { id: realtorId } },
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
    throw new UserError("Sem permissão para visualizar esta proposta.")
  }

  return serializeDecimals(proposal)
}

// Tipo do detalhe já serializado (Decimal -> string) — usado pelos
// componentes client que consomem getAdminProposal (painel de detalhe,
// timeline, edição), pra não vazar `Decimal` de volta pro client.
export type AdminProposalDetail = NonNullable<Awaited<ReturnType<typeof getAdminProposal>>>

async function assertCanManageProposal(
  session: Awaited<ReturnType<typeof requireSession>>,
  proposalId: string
) {
  if (!(await can(session.user, "proposal.manage"))) {
    throw new UserError("Sem permissão para gerenciar propostas.")
  }

  const canViewAll = await can(session.user, "proposal.view.all")
  if (canViewAll) return

  const proposal = await proposalRepository.findProposalById(proposalId)
  if (!proposal || proposal.realtorId !== session.user.realtorId) {
    throw new UserError("Sem permissão para gerenciar esta proposta.")
  }
}

export async function updateProposal(id: string, input: unknown) {
  const session = await requireSession()
  await assertCanManageProposal(session, id)

  const data = proposalInputSchema.partial().parse(input)
  // O formulário de edição manda sempre o conjunto inteiro, e campo vazio
  // chega como undefined. No update do Prisma, undefined mantém o valor
  // antigo (trocar de Financiado pra À vista deixava a entrada gravada),
  // por isso aqui vazio vira null.
  await proposalRepository.updateProposal(id, {
    value: data.value,
    ...(data.paymentMethod === undefined
      ? {}
      : {
          ...paymentData(data.paymentMethod, data),
          paymentMethod: data.paymentMethod,
          originalValue: data.originalValue ?? null,
          commissionPercent: data.commissionPercent ?? null,
          validUntil: data.validUntil ?? null,
        }),
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

  // Sem isso, dava pra mover a proposta direto pra "Assinando"/"Concluída"
  // pelo seletor de status sem nunca clicar em "Gerar contrato" (que só
  // aparecia com status "Aceita") — o negócio fechava mas ficava invisível
  // em Contratos. Gera sozinho se ainda não existir um contrato pra essa
  // proposta.
  if (status === "SIGNING" || status === "COMPLETED") {
    const existingContract = await contractRepository.findContractByProposalId(id)
    if (!existingContract) {
      const proposal = await proposalRepository.findProposalById(id)
      if (proposal) {
        await contractRepository.createContract({
          value: proposal.value,
          status: status === "COMPLETED" ? "COMPLETED" : "DRAFT",
          proposal: { connect: { id: proposal.id } },
          property: { connect: { id: proposal.property.id } },
          client: { connect: { id: proposal.client.id } },
          realtor: { connect: { id: proposal.realtor.id } },
        })
        revalidatePath("/admin/contratos")
      }
    }
  }

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
