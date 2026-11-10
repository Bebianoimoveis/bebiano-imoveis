"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity-log"
import type { Prisma } from "@/generated/prisma/client"
import {
  clientCreateSchema,
  clientFiltersSchema,
  clientInteractionSchema,
  clientPreferenceSchema,
  clientUpdateSchema,
} from "@/modules/client/schema"
import * as clientRepository from "@/modules/client/repository"
import { clientMatchWhere } from "@/modules/client/document-search"

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new Error("Não autenticado.")
  return session
}

// Leitura pro widget "Aniversários" do Dashboard — mesmo escopo por
// corretor de client.view.all usado em todo o resto do módulo.
export async function listAdminUpcomingBirthdays(daysAhead = 7) {
  const session = await requireSession()
  const canViewAll = await can(session.user, "client.view.all")
  return clientRepository.listUpcomingBirthdays(
    { realtorId: canViewAll ? undefined : (session.user.realtorId ?? "__none__") },
    daysAhead
  )
}

// Corretores sem client.view.all só enxergam os próprios clientes. O
// sentinel garante zero resultados caso o usuário não tenha realtorId
// vinculado — mesmo padrão do módulo de Leads.
async function buildClientScopeWhere(
  session: Awaited<ReturnType<typeof requireSession>>,
  filters: ReturnType<typeof clientFiltersSchema.parse>
): Promise<Prisma.ClientWhereInput> {
  const canViewAll = await can(session.user, "client.view.all")

  return {
    realtorId: canViewAll ? filters.realtorId : (session.user.realtorId ?? "__none__"),
    cityId: filters.cityId,
    city: filters.state ? { state: filters.state } : undefined,
    origin: filters.origin,
    status: filters.status,
    vip: filters.vip,
    types: filters.type ? { has: filters.type } : undefined,
    createdAt:
      filters.createdFrom || filters.createdTo
        ? { gte: filters.createdFrom, lte: filters.createdTo }
        : undefined,
    lastInteractionAt:
      filters.lastInteractionFrom || filters.lastInteractionTo
        ? { gte: filters.lastInteractionFrom, lte: filters.lastInteractionTo }
        : undefined,
    OR: filters.search
      ? [
          { name: { contains: filters.search, mode: "insensitive" } },
          { phone: { contains: filters.search } },
          { email: { contains: filters.search, mode: "insensitive" } },
          { code: { contains: filters.search, mode: "insensitive" } },
          { cpf: { contains: filters.search } },
          { rg: { contains: filters.search } },
          { city: { name: { contains: filters.search, mode: "insensitive" } } },
        ]
      : undefined,
  }
}

export async function listAdminClients(rawFilters: unknown) {
  const session = await requireSession()
  const filters = clientFiltersSchema.parse(rawFilters ?? {})
  const where = await buildClientScopeWhere(session, filters)

  return clientRepository.listClients(where)
}

export async function suggestClients(query: string) {
  const session = await requireSession()
  if (query.trim().length < 2) return []

  const canViewAll = await can(session.user, "client.view.all")
  const where: Prisma.ClientWhereInput = {
    realtorId: canViewAll ? undefined : (session.user.realtorId ?? "__none__"),
    // Nome, telefone, e-mail, código, CPF ou RG (com ou sem pontuação).
    ...(await clientMatchWhere(query)),
  }

  return clientRepository.suggestClients(where, 6)
}

export async function getClientCrmStats(rawFilters: unknown, periodDays = 30) {
  const session = await requireSession()
  const filters = clientFiltersSchema.parse(rawFilters ?? {})
  const where = await buildClientScopeWhere(session, filters)

  const periodFrom = new Date()
  periodFrom.setDate(periodFrom.getDate() - periodDays)

  return clientRepository.getClientStats(where, periodFrom)
}

function toCsvValue(value: string | number) {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export async function exportClientsCsv(rawFilters: unknown) {
  const session = await requireSession()
  const filters = clientFiltersSchema.parse(rawFilters ?? {})
  const where = await buildClientScopeWhere(session, filters)

  const clients = await clientRepository.listClients(where)

  const header = ["Código", "Nome", "Telefone", "E-mail", "Cidade", "Corretor", "Status", "Criado em"]
  const rows = clients.map((client) => [
    client.code,
    client.name,
    client.phone,
    client.email ?? "",
    client.city?.name ?? "",
    client.realtor?.user.name ?? "",
    client.status,
    client.createdAt.toLocaleDateString("pt-BR"),
  ])

  return [header, ...rows].map((row) => row.map(toCsvValue).join(",")).join("\n")
}

export async function createClientManually(input: unknown) {
  const session = await requireSession()
  if (!(await can(session.user, "client.manage"))) {
    throw new Error("Sem permissão para cadastrar clientes.")
  }

  const data = clientCreateSchema.parse(input)
  const client = await clientRepository.createClient(data)

  await logActivity({
    userId: session.user.id,
    action: "client.create",
    entityType: "Client",
    entityId: client.id,
  })

  revalidatePath("/admin/clientes")
  return client
}

export async function getAdminClient(id: string) {
  const session = await requireSession()
  const client = await clientRepository.findClientById(id)
  if (!client) return null

  const canViewAll = await can(session.user, "client.view.all")
  if (!canViewAll && client.realtorId !== session.user.realtorId) {
    throw new Error("Sem permissão para visualizar este cliente.")
  }

  return client
}

// Imóveis que já apareceram ligados a esse cliente — o(s) que ele
// demonstrou interesse (via lead que virou esse cliente) e o(s) que já
// receberam proposta. Usado pra sugerir o imóvel (com foto) na hora de
// cadastrar um contrato manual, em vez de pedir pra buscar o código de
// novo. Consulta única (em vez de reaproveitar os objetos já incluídos
// em getAdminClient) porque aqueles não trazem a imagem de capa.
export async function getClientInterestedProperties(clientId: string) {
  const context = await getClientDealContext(clientId)
  return context?.properties ?? []
}

export type ClientLinkedProperty = {
  id: string
  code: string
  title: string
  imageUrl: string | null
  price: number
  realtorId: string | null
  // De onde vem a ligação: contrato, proposta ou interesse (lead).
  reason: "Contrato" | "Proposta" | "Interesse"
}

// Tudo que já está ligado ao cliente — contratos, propostas, interesses —
// pra preencher sozinho a proposta/contrato novo: imóveis (com foto), o
// corretor que já atende o cliente e um resumo do histórico.
export async function getClientDealContext(clientId: string): Promise<{
  properties: ClientLinkedProperty[]
  realtorId: string | null
  contracts: { id: string; propertyCode: string; status: string; value: number }[]
  proposalsCount: number
} | null> {
  const client = await getAdminClient(clientId)
  if (!client) return null

  const reasons = new Map<string, ClientLinkedProperty["reason"]>()
  for (const contract of client.contracts) if (!reasons.has(contract.propertyId)) reasons.set(contract.propertyId, "Contrato")
  for (const proposal of client.proposals) if (!reasons.has(proposal.property.id)) reasons.set(proposal.property.id, "Proposta")
  for (const lead of client.leads) if (lead.propertyId && !reasons.has(lead.propertyId)) reasons.set(lead.propertyId, "Interesse")

  const properties = reasons.size
    ? await prisma.property.findMany({
        where: { id: { in: [...reasons.keys()] } },
        select: {
          id: true,
          code: true,
          title: true,
          price: true,
          realtorId: true,
          images: { where: { isCover: true }, select: { url: true }, take: 1 },
        },
      })
    : []
  const order = [...reasons.keys()]

  return {
    properties: properties
      .map((property) => ({
        id: property.id,
        code: property.code,
        title: property.title,
        imageUrl: property.images[0]?.url ?? null,
        price: Number(property.price),
        realtorId: property.realtorId,
        reason: reasons.get(property.id)!,
      }))
      .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)),
    // Corretor do cliente; sem isso, o do contrato/proposta mais recente.
    realtorId: client.realtorId ?? client.contracts[0]?.realtorId ?? client.proposals[0]?.realtorId ?? null,
    contracts: client.contracts.map((contract) => ({
      id: contract.id,
      propertyCode: contract.property.code,
      status: contract.status,
      value: Number(contract.value),
    })),
    proposalsCount: client.proposals.length,
  }
}

async function assertCanManageClient(
  session: Awaited<ReturnType<typeof requireSession>>,
  clientId: string
) {
  if (!(await can(session.user, "client.manage"))) {
    throw new Error("Sem permissão para gerenciar clientes.")
  }

  const canViewAll = await can(session.user, "client.view.all")
  if (canViewAll) return

  const client = await clientRepository.findClientById(clientId)
  if (!client || client.realtorId !== session.user.realtorId) {
    throw new Error("Sem permissão para gerenciar este cliente.")
  }
}

export async function updateClient(clientId: string, input: unknown) {
  const session = await requireSession()
  await assertCanManageClient(session, clientId)

  const data = clientUpdateSchema.parse(input)
  const client = await clientRepository.updateClient(clientId, {
    name: data.name,
    phone: data.phone,
    email: data.email === undefined ? undefined : data.email || null,
    cpf: data.cpf,
    rg: data.rg,
    birthDate: data.birthDate,
    profession: data.profession,
    maritalStatus: data.maritalStatus,
    street: data.street,
    number: data.number,
    zipCode: data.zipCode,
    notes: data.notes,
    types: data.types,
    status: data.status,
    vip: data.vip,
    tags: data.tags,
    // data.cityId/realtorId: undefined → não mexe; null → desvincula;
    // string → atribui.
    ...(data.cityId === undefined
      ? {}
      : { city: data.cityId ? { connect: { id: data.cityId } } : { disconnect: true } }),
    ...(data.realtorId === undefined
      ? {}
      : { realtor: data.realtorId ? { connect: { id: data.realtorId } } : { disconnect: true } }),
  })

  await logActivity({
    userId: session.user.id,
    action: "client.edit",
    entityType: "Client",
    entityId: client.id,
  })

  revalidatePath("/admin/clientes")
  return client
}

export async function deleteClient(clientId: string) {
  const session = await requireSession()
  await assertCanManageClient(session, clientId)

  await clientRepository.softDeleteClient(clientId)

  await logActivity({
    userId: session.user.id,
    action: "client.archive",
    entityType: "Client",
    entityId: clientId,
  })

  revalidatePath("/admin/clientes")
}

export async function addClientInteraction(clientId: string, input: unknown) {
  const session = await requireSession()
  await assertCanManageClient(session, clientId)

  const data = clientInteractionSchema.parse(input)
  await clientRepository.createClientInteraction({
    clientId,
    userId: session.user.id,
    type: data.type,
    description: data.description,
  })

  revalidatePath("/admin/clientes")
}

export async function updateClientInteraction(clientId: string, interactionId: string, description: string) {
  const session = await requireSession()
  await assertCanManageClient(session, clientId)

  if (!description.trim()) throw new Error("Descreva a interação.")
  await clientRepository.updateClientInteraction(interactionId, description)

  revalidatePath("/admin/clientes")
}

export async function deleteClientInteraction(clientId: string, interactionId: string) {
  const session = await requireSession()
  await assertCanManageClient(session, clientId)

  await clientRepository.deleteClientInteraction(interactionId)

  revalidatePath("/admin/clientes")
}

export async function saveClientPreference(clientId: string, input: unknown) {
  const session = await requireSession()
  await assertCanManageClient(session, clientId)

  const data = clientPreferenceSchema.parse(input)
  const preference = await clientRepository.upsertClientPreference(clientId, {
    propertyTypeId: data.propertyTypeId ?? null,
    purpose: data.purpose ?? null,
    minValue: data.minValue ?? null,
    maxValue: data.maxValue ?? null,
    cityId: data.cityId ?? null,
    neighborhoodId: data.neighborhoodId ?? null,
    bedrooms: data.bedrooms ?? null,
    minArea: data.minArea ?? null,
    pool: data.pool,
    gatedCommunity: data.gatedCommunity,
    acceptsFinancing: data.acceptsFinancing,
  })

  revalidatePath("/admin/clientes")
  return preference
}
