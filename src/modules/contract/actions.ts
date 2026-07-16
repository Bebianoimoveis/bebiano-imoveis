"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { logActivity } from "@/lib/activity-log"
import type { Prisma, ContractStatus } from "@/generated/prisma/client"
import * as contractRepository from "@/modules/contract/repository"
import * as proposalRepository from "@/modules/proposal/repository"

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new Error("Não autenticado.")
  return session
}

async function requireContractManage() {
  const session = await requireSession()
  if (!(await can(session.user, "contract.manage"))) {
    throw new Error("Sem permissão para gerenciar contratos.")
  }
  return session
}

export async function listAdminContracts(status?: ContractStatus) {
  const session = await requireSession()
  const canViewAll = await can(session.user, "contract.view.all")

  const where: Prisma.ContractWhereInput = {
    status,
    realtorId: canViewAll
      ? undefined
      : (session.user.realtorId ?? "__none__"),
  }

  return contractRepository.listContracts(where)
}

// Um contrato só pode nascer de uma proposta aceita — é a proposta que
// carrega o valor negociado e as partes envolvidas.
export async function generateContractFromProposal(proposalId: string) {
  const session = await requireContractManage()

  const proposal = await proposalRepository.findProposalById(proposalId)
  if (!proposal) throw new Error("Proposta não encontrada.")
  if (proposal.status !== "ACCEPTED") {
    throw new Error("Só é possível gerar contrato para propostas aceitas.")
  }

  const existing = await contractRepository.findContractByProposalId(proposalId)
  if (existing) return { id: existing.id }

  const contract = await contractRepository.createContract({
    value: proposal.value,
    status: "DRAFT",
    proposal: { connect: { id: proposal.id } },
    property: { connect: { id: proposal.property.id } },
    client: { connect: { id: proposal.client.id } },
    realtor: { connect: { id: proposal.realtor.id } },
  })

  await logActivity({
    userId: session.user.id,
    action: "contract.create",
    entityType: "Contract",
    entityId: contract.id,
    metadata: { proposalId },
  })

  revalidatePath("/admin/contratos")
  revalidatePath("/admin/propostas")
  // `value` é Decimal — não devolver o objeto Prisma inteiro ao client.
  return { id: contract.id }
}

export async function updateContractStatus(id: string, status: ContractStatus) {
  const session = await requireContractManage()
  await contractRepository.updateContractStatus(id, status)

  await logActivity({
    userId: session.user.id,
    action: `contract.status.${status.toLowerCase()}`,
    entityType: "Contract",
    entityId: id,
  })

  revalidatePath("/admin/contratos")
}
