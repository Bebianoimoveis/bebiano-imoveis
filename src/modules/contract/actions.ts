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
import { clientMatchWhere } from "@/modules/client/document-search"
import { renderProposalPdf } from "@/modules/proposal/pdf-render"
import { cloudinary } from "@/lib/cloudinary"

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

export type ContractListFilters = {
  status?: ContractStatus
  // Texto livre: cliente (nome, CPF, RG, telefone, e-mail, código) ou
  // imóvel (código, título).
  search?: string
  clientId?: string
  realtorId?: string
}

export async function listAdminContracts(filters: ContractListFilters = {}) {
  const session = await requireSession()
  const canViewAll = await can(session.user, "contract.view.all")

  const and: Prisma.ContractWhereInput[] = []
  const search = filters.search?.trim()
  if (search) {
    and.push({
      OR: [
        { client: await clientMatchWhere(search) },
        { property: { code: { contains: search, mode: "insensitive" } } },
        { property: { title: { contains: search, mode: "insensitive" } } },
      ],
    })
  }

  const where: Prisma.ContractWhereInput = {
    status: filters.status,
    clientId: filters.clientId,
    realtorId: canViewAll
      ? filters.realtorId
      : (session.user.realtorId ?? "__none__"),
    ...(and.length ? { AND: and } : {}),
  }

  return contractRepository.listContracts(where)
}

// Envia o PDF gerado (Buffer) pro Cloudinary como arquivo "raw" na pasta
// dos contratos — mesmo lugar dos contratos anexados à mão, aberto depois
// pelo /api/arquivo.
function uploadPdfToContracts(buffer: Buffer, fileName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "bebiano-imoveis/contratos",
        public_id: `${fileName.replace(/\.pdf$/i, "")}-${Date.now()}.pdf`,
      },
      (error, result) => {
        if (error || !result) reject(error ?? new Error("Falha no envio do PDF."))
        else resolve(result.secure_url)
      }
    )
    stream.end(buffer)
  })
}

export type ProposalConversionResult = {
  contractId: string
  alreadyExisted: boolean
  proposalPdfAttached: boolean
  // Quem não tem contract.manage (ex: corretor) converte, mas a
  // assinatura é anexada pela gestão.
  canAttach: boolean
  attachments: { id: string; name: string; url: string }[]
  contractStatus: ContractStatus
}

// "Converter em contrato" — um clique depois que o cliente aprova:
// cria o contrato com os dados da proposta, anexa o PDF da proposta
// aprovada e põe a proposta em "Assinando". Chamar de novo pra uma
// proposta que já virou contrato só devolve o contrato existente.
export async function convertProposalToContract(proposalId: string): Promise<ProposalConversionResult | { error: string }> {
  const session = await requireSession()
  const [canManageContracts, canManageProposals, canViewAllProposals] = await Promise.all([
    can(session.user, "contract.manage"),
    can(session.user, "proposal.manage"),
    can(session.user, "proposal.view.all"),
  ])

  const proposal = await proposalRepository.findProposalById(proposalId)
  if (!proposal) return { error: "Proposta não encontrada." }
  const ownsProposal = canManageProposals && (canViewAllProposals || proposal.realtorId === session.user.realtorId)
  if (!canManageContracts && !ownsProposal) return { error: "Sem permissão para converter esta proposta." }
  if (proposal.status === "REJECTED" || proposal.status === "CANCELED") {
    return { error: "Proposta recusada ou cancelada não vira contrato. Mude o status dela antes." }
  }

  const existing = await prisma.contract.findUnique({
    where: { proposalId },
    include: { attachments: { orderBy: { createdAt: "asc" } } },
  })
  if (existing) {
    return {
      contractId: existing.id,
      alreadyExisted: true,
      proposalPdfAttached: existing.attachments.some((a) => a.name.startsWith("Proposta aprovada")),
      canAttach: canManageContracts,
      attachments: existing.attachments.map((a) => ({ id: a.id, name: a.name, url: a.url })),
      contractStatus: existing.status,
    }
  }

  const contract = await contractRepository.createContract({
    value: proposal.value,
    status: proposal.status === "COMPLETED" ? "COMPLETED" : "DRAFT",
    proposal: { connect: { id: proposal.id } },
    property: { connect: { id: proposal.property.id } },
    client: { connect: { id: proposal.client.id } },
    realtor: { connect: { id: proposal.realtor.id } },
  })

  if (proposal.status !== "COMPLETED" && proposal.status !== "SIGNING") {
    await proposalRepository.updateProposalStatus(proposal.id, "SIGNING")
  }

  // PDF da proposta aprovada vai junto como primeiro anexo do contrato.
  // Se o envio falhar, o contrato continua criado — só avisa na tela.
  let attachment: { id: string; name: string; url: string } | null = null
  try {
    const name = `Proposta aprovada - ${proposal.property.code}.pdf`
    const url = await uploadPdfToContracts(await renderProposalPdf(proposal), `proposta-${proposal.property.code}`)
    const created = await contractRepository.addContractAttachment({
      contractId: contract.id,
      url,
      name,
      uploadedById: session.user.id,
    })
    attachment = { id: created.id, name, url }
  } catch (error) {
    console.error("Falha ao anexar PDF da proposta ao contrato", error)
  }

  await logActivity({
    userId: session.user.id,
    action: "contract.create",
    entityType: "Contract",
    entityId: contract.id,
    metadata: { proposalId, via: "convert" },
  })

  revalidatePath("/admin/contratos")
  revalidatePath("/admin/propostas")
  return {
    contractId: contract.id,
    alreadyExisted: false,
    proposalPdfAttached: Boolean(attachment),
    canAttach: canManageContracts,
    attachments: attachment ? [attachment] : [],
    contractStatus: contract.status,
  }
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
  const contract = await contractRepository.updateContractStatus(id, status)

  // Contrato assinado (Ativo) ou Concluído encerra a proposta que deu
  // origem a ele: ela passa pra "Concluída" sozinha.
  if (contract.proposal && (status === "ACTIVE" || status === "COMPLETED")) {
    await prisma.proposal.updateMany({
      where: { id: contract.proposal.id, status: { not: "COMPLETED" } },
      data: { status: "COMPLETED" },
    })
    revalidatePath("/admin/propostas")
  }

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
