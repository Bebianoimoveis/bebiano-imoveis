import { prisma } from "@/lib/prisma"
import type { Prisma, ContractStatus } from "@/generated/prisma/client"

const contractInclude = {
  property: { select: { id: true, title: true, code: true } },
  client: true,
  realtor: { include: { user: true } },
  proposal: { select: { id: true, value: true } },
} satisfies Prisma.ContractInclude

export type ContractListItem = Prisma.ContractGetPayload<{
  include: typeof contractInclude
}>

export async function listContracts(
  where: Prisma.ContractWhereInput
): Promise<ContractListItem[]> {
  return prisma.contract.findMany({
    where,
    include: contractInclude,
    orderBy: { createdAt: "desc" },
  })
}

export async function findContractByProposalId(proposalId: string) {
  return prisma.contract.findUnique({ where: { proposalId } })
}

export async function createContract(data: Prisma.ContractCreateInput) {
  return prisma.contract.create({ data, include: contractInclude })
}

export async function updateContractStatus(id: string, status: ContractStatus) {
  return prisma.contract.update({
    where: { id },
    data: {
      status,
      signedAt: status === "ACTIVE" ? new Date() : undefined,
    },
    include: contractInclude,
  })
}
