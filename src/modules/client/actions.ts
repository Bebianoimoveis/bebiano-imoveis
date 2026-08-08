"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
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
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { phone: { contains: query } },
      { code: { contains: query, mode: "insensitive" } },
    ],
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
