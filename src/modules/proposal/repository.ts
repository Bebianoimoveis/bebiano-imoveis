import { prisma } from "@/lib/prisma"
import type { Prisma, ProposalStatus } from "@/generated/prisma/client"

const proposalInclude = {
  property: { select: { id: true, title: true, code: true } },
  client: true,
  realtor: { include: { user: true } },
  contract: { select: { id: true } },
} satisfies Prisma.ProposalInclude

export type ProposalListItem = Prisma.ProposalGetPayload<{
  include: typeof proposalInclude
}>

export async function listProposals(
  where: Prisma.ProposalWhereInput
): Promise<ProposalListItem[]> {
  return prisma.proposal.findMany({
    where,
    include: proposalInclude,
    orderBy: { createdAt: "desc" },
  })
}

export async function findProposalById(
  id: string
): Promise<ProposalListItem | null> {
  return prisma.proposal.findUnique({ where: { id }, include: proposalInclude })
}

export async function createProposal(data: Prisma.ProposalCreateInput) {
  return prisma.proposal.create({ data, include: proposalInclude })
}

export async function updateProposalStatus(id: string, status: ProposalStatus) {
  return prisma.proposal.update({
    where: { id },
    data: { status },
    include: proposalInclude,
  })
}
