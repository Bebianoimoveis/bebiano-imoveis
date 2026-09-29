"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity-log"
import { serializeDecimals } from "@/lib/serialize"
import type { Prisma, ContractStatus } from "@/generated/prisma/client"
import * as contractRepository from "@/modules/contract/repository"
import * as proposalRepository from "@/modules/proposal/repository"
import { manualContractInputSchema, contractAttachmentInputSchema } from "@/modules/contract/schema"

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

// Um contrato só pode nascer de uma proposta aceita (ou já mais adiante
// no funil — Assinando/Concluída também valem, pra permitir gerar
// retroativamente uma proposta que pulou essa etapa sem contrato).
export async function generateContractFromProposal(proposalId: string) {
  const session = await requireContractManage()

  const proposal = await proposalRepository.findProposalById(proposalId)
  if (!proposal) throw new Error("Proposta não encontrada.")
  if (!["ACCEPTED", "SIGNING", "COMPLETED"].includes(proposal.status)) {
    throw new Error("Só é possível gerar contrato para propostas aceitas, assinando ou concluídas.")
  }

  const existing = await contractRepository.findContractByProposalId(proposalId)
  if (existing) return { id: existing.id }

  const contract = await contractRepository.createContract({
    value: proposal.value,
    status: proposal.status === "COMPLETED" ? "COMPLETED" : "DRAFT",
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

// Cadastro direto de contrato, sem passar por uma proposta — pensado
// pra negócio fechado fora do sistema ou contrato antigo, anexando o
// arquivo assinado (opcional) na hora.
export async function createManualContract(input: unknown) {
  const session = await requireContractManage()
  const data = manualContractInputSchema.parse(input)

  const contract = await contractRepository.createContract({
    value: data.value,
    status: data.status,
    fileUrl: data.fileUrl,
    property: { connect: { id: data.propertyId } },
    client: { connect: { id: data.clientId } },
    realtor: { connect: { id: data.realtorId } },
  })

  await logActivity({
    userId: session.user.id,
    action: "contract.create.manual",
    entityType: "Contract",
    entityId: contract.id,
  })

  revalidatePath("/admin/contratos")
  revalidatePath("/admin/clientes")
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

export async function getAdminContract(id: string) {
  const session = await requireSession()
  const canViewAll = await can(session.user, "contract.view.all")

  const contract = await contractRepository.findContractById(id)
  if (!contract) return null
  if (!canViewAll && contract.realtorId !== session.user.realtorId) {
    throw new Error("Sem permissão para visualizar este contrato.")
  }

  return serializeDecimals(contract)
}

export async function addContractAttachment(contractId: string, input: unknown) {
  const session = await requireContractManage()
  const data = contractAttachmentInputSchema.parse(input)

  await contractRepository.addContractAttachment({
    contractId,
    url: data.url,
    name: data.name,
    uploadedById: session.user.id,
  })

  await logActivity({
    userId: session.user.id,
    action: "contract.attachment.add",
    entityType: "Contract",
    entityId: contractId,
  })

  revalidatePath("/admin/contratos")
}

export async function deleteContractAttachment(contractId: string, attachmentId: string) {
  const session = await requireContractManage()
  await contractRepository.deleteContractAttachment(attachmentId)

  await logActivity({
    userId: session.user.id,
    action: "contract.attachment.delete",
    entityType: "Contract",
    entityId: contractId,
  })

  revalidatePath("/admin/contratos")
}

// Sem soft-delete aqui (mesmo padrão do Appointment) — só bloqueia se
// tiver lançamento financeiro vinculado, pra não perder registro real
// de comissão/pagamento por tabela; anexos são removidos junto sem
// problema (ver deleteContract no repository). Erro esperado volta
// como valor, não `throw`: Server Action que lança erro tem a mensagem
// mascarada em produção nessa versão do Next (mesmo motivo documentado
// em taxonomy/actions.ts).
export async function deleteContract(id: string): Promise<{ error: string } | undefined> {
  const session = await requireContractManage()

  const linkedEntries = await prisma.financialEntry.count({ where: { contractId: id } })
  if (linkedEntries > 0) {
    return {
      error: `Este contrato tem ${linkedEntries} lançamento(s) financeiro(s) vinculado(s) e não pode ser excluído — desvincule ou exclua esses lançamentos primeiro.`,
    }
  }

  await contractRepository.deleteContract(id)

  await logActivity({
    userId: session.user.id,
    action: "contract.delete",
    entityType: "Contract",
    entityId: id,
  })

  revalidatePath("/admin/contratos")
  revalidatePath("/admin/propostas")
}
