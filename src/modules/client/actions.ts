"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { logActivity } from "@/lib/activity-log"
import type { Prisma } from "@/generated/prisma/client"
import { clientFiltersSchema, clientInputSchema } from "@/modules/client/schema"
import * as clientRepository from "@/modules/client/repository"

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new Error("Não autenticado.")
  return session
}

async function requireClientManage() {
  const session = await requireSession()
  if (!(await can(session.user, "client.manage"))) {
    throw new Error("Sem permissão para gerenciar clientes.")
  }
  return session
}

export async function listAdminClients(rawFilters: unknown) {
  await requireSession()
  const filters = clientFiltersSchema.parse(rawFilters ?? {})

  const where: Prisma.ClientWhereInput = {
    OR: filters.search
      ? [
          { name: { contains: filters.search, mode: "insensitive" } },
          { phone: { contains: filters.search, mode: "insensitive" } },
          { email: { contains: filters.search, mode: "insensitive" } },
        ]
      : undefined,
  }

  return clientRepository.listClients(where)
}

export async function createClient(input: unknown) {
  const session = await requireClientManage()
  const data = clientInputSchema.parse(input)

  const client = await clientRepository.createClient({
    name: data.name,
    phone: data.phone,
    email: data.email || null,
    notes: data.notes || null,
  })

  await logActivity({
    userId: session.user.id,
    action: "client.create",
    entityType: "Client",
    entityId: client.id,
  })

  revalidatePath("/admin/clientes")
  return client
}

export async function updateClient(id: string, input: unknown) {
  const session = await requireClientManage()
  const data = clientInputSchema.parse(input)

  const client = await clientRepository.updateClient(id, {
    name: data.name,
    phone: data.phone,
    email: data.email || null,
    notes: data.notes || null,
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

export async function archiveClient(id: string) {
  const session = await requireClientManage()
  const client = await clientRepository.softDeleteClient(id)

  await logActivity({
    userId: session.user.id,
    action: "client.archive",
    entityType: "Client",
    entityId: client.id,
  })

  revalidatePath("/admin/clientes")
  return client
}
