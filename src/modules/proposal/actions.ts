"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { logActivity } from "@/lib/activity-log"
import type { Prisma, ProposalStatus } from "@/generated/prisma/client"
import { proposalInputSchema } from "@/modules/proposal/schema"
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

export async function listAdminProposals(status?: ProposalStatus) {
  const session = await requireSession()
  const canViewAll = await can(session.user, "proposal.view.all")

  const where: Prisma.ProposalWhereInput = {
    status,
    realtorId: canViewAll
      ? undefined
      : (session.user.realtorId ?? "__none__"),
  }

  return proposalRepository.listProposals(where)
}

export async function createProposal(input: unknown) {
  const session = await requireProposalManage()
  const data = proposalInputSchema.parse(input)

  const proposal = await proposalRepository.createProposal({
    value: data.value,
    notes: data.notes,
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
  // O campo `value` é um Decimal do Prisma — não é serializável de volta
  // para um Client Component via Server Action, então devolvemos só o id.
  return { id: proposal.id }
}

export async function updateProposalStatus(id: string, status: ProposalStatus) {
  const session = await requireProposalManage()
  await proposalRepository.updateProposalStatus(id, status)

  await logActivity({
    userId: session.user.id,
    action: `proposal.status.${status.toLowerCase()}`,
    entityType: "Proposal",
    entityId: id,
  })

  revalidatePath("/admin/propostas")
}
