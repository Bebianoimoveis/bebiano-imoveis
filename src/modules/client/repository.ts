import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

export async function listClients(where: Prisma.ClientWhereInput) {
  return prisma.client.findMany({
    where: { ...where, deletedAt: null },
    orderBy: { name: "asc" },
    include: { _count: { select: { leads: true } } },
  })
}

export async function findClientById(id: string) {
  return prisma.client.findFirst({
    where: { id, deletedAt: null },
  })
}

export async function createClient(data: Prisma.ClientCreateInput) {
  return prisma.client.create({ data })
}

export async function updateClient(id: string, data: Prisma.ClientUpdateInput) {
  return prisma.client.update({ where: { id }, data })
}

export async function softDeleteClient(id: string) {
  return prisma.client.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}
