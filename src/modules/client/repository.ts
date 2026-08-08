import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

type TransactionClient = Prisma.TransactionClient

const clientListInclude = {
  city: { select: { id: true, name: true, state: true } },
  realtor: { include: { user: true } },
  _count: { select: { leads: true, proposals: true } },
} satisfies Prisma.ClientInclude

const clientDetailInclude = {
  city: { select: { id: true, name: true, state: true } },
  realtor: { include: { user: true } },
  leads: { orderBy: { createdAt: "desc" as const } },
  appointments: { orderBy: { scheduledAt: "desc" as const } },
  proposals: { orderBy: { createdAt: "desc" as const }, include: { property: true } },
  contracts: { orderBy: { createdAt: "desc" as const }, include: { property: true } },
  interactions: { orderBy: { createdAt: "desc" as const }, include: { user: true } },
  preference: {
    include: { propertyType: true, city: true, neighborhood: true },
  },
} satisfies Prisma.ClientInclude

export type ClientListItem = Prisma.ClientGetPayload<{ include: typeof clientListInclude }>
export type ClientDetail = Prisma.ClientGetPayload<{ include: typeof clientDetailInclude }>

// Código sequencial CL-0001, CL-0002... — gerado dentro da própria
// transação de criação pra evitar corrida entre dois cadastros
// simultâneos (mesmo cuidado dado a outros contadores do projeto).
async function nextClientCode(tx: TransactionClient) {
  const last = await tx.client.findFirst({
    orderBy: { code: "desc" },
    select: { code: true },
  })
  const lastNumber = last ? Number(last.code.replace("CL-", "")) || 0 : 0
  return `CL-${String(lastNumber + 1).padStart(4, "0")}`
}

export async function listClients(where: Prisma.ClientWhereInput): Promise<ClientListItem[]> {
  return prisma.client.findMany({
    where: { ...where, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: clientListInclude,
  })
}

export async function findClientById(id: string): Promise<ClientDetail | null> {
  return prisma.client.findFirst({
    where: { id, deletedAt: null },
    include: clientDetailInclude,
  })
}

export type UpcomingBirthday = { id: string; name: string; phone: string; birthDate: Date; daysUntil: number }

// Sem suporte nativo do Prisma pra "mês/dia, ignorando o ano" — busca só
// quem tem data de nascimento e calcula a próxima ocorrência em memória.
// Volume baixo (clientes de uma imobiliária local), sem custo real.
export async function listUpcomingBirthdays(
  where: Prisma.ClientWhereInput,
  daysAhead: number
): Promise<UpcomingBirthday[]> {
  const clients = await prisma.client.findMany({
    where: { ...where, deletedAt: null, birthDate: { not: null } },
    select: { id: true, name: true, phone: true, birthDate: true },
  })

  const now = new Date()
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())

  return clients
    .map((client) => {
      const birth = client.birthDate as Date
      let next = Date.UTC(now.getUTCFullYear(), birth.getUTCMonth(), birth.getUTCDate())
      if (next < todayUTC) next = Date.UTC(now.getUTCFullYear() + 1, birth.getUTCMonth(), birth.getUTCDate())
      const daysUntil = Math.round((next - todayUTC) / 86400000)
      return { id: client.id, name: client.name, phone: client.phone, birthDate: birth, daysUntil }
    })
    .filter((client) => client.daysUntil <= daysAhead)
    .sort((a, b) => a.daysUntil - b.daysUntil)
}

type CreateClientInput = {
  name: string
  phone: string
  email?: string | null
  origin?: string | null
  types?: ("BUYER" | "SELLER" | "TENANT" | "INVESTOR")[]
  vip?: boolean
  realtorId?: string | null
  cityId?: string | null
  notes?: string | null
}

export async function createClient(data: CreateClientInput) {
  return prisma.$transaction(async (tx) => {
    const code = await nextClientCode(tx)
    return tx.client.create({
      data: {
        code,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        origin: data.origin || null,
        types: data.types ?? [],
        vip: data.vip ?? false,
        realtorId: data.realtorId || null,
        cityId: data.cityId || null,
        notes: data.notes || null,
      },
      include: clientListInclude,
    })
  })
}

export async function updateClient(id: string, data: Prisma.ClientUpdateInput) {
  return prisma.client.update({
    where: { id },
    data,
    include: clientDetailInclude,
  })
}

export async function softDeleteClient(id: string) {
  return prisma.client.update({ where: { id }, data: { deletedAt: new Date() } })
}

export async function suggestClients(where: Prisma.ClientWhereInput, take: number) {
  return prisma.client.findMany({
    where: { ...where, deletedAt: null },
    select: { id: true, name: true, phone: true, code: true },
    orderBy: { createdAt: "desc" },
    take,
  })
}

// KPIs do topo do CRM. Contagem por tipo é feita com `has` por tipo (em
// vez de groupBy, que o Postgres/Prisma não faz direto sobre coluna
// array) — 4 tipos fixos, não compensa generalizar.
export async function getClientStats(where: Prisma.ClientWhereInput, periodFrom: Date) {
  const base = { ...where, deletedAt: null }

  const [total, active, newInPeriod, buyers, sellers, tenants, investors, vip] = await Promise.all([
    prisma.client.count({ where: base }),
    prisma.client.count({ where: { ...base, status: "ACTIVE" } }),
    prisma.client.count({ where: { ...base, createdAt: { gte: periodFrom } } }),
    prisma.client.count({ where: { ...base, types: { has: "BUYER" } } }),
    prisma.client.count({ where: { ...base, types: { has: "SELLER" } } }),
    prisma.client.count({ where: { ...base, types: { has: "TENANT" } } }),
    prisma.client.count({ where: { ...base, types: { has: "INVESTOR" } } }),
    prisma.client.count({ where: { ...base, vip: true } }),
  ])

  return { total, active, newInPeriod, buyers, sellers, tenants, investors, vip }
}

export async function createClientInteraction(input: {
  clientId: string
  userId: string
  type: "CALL" | "WHATSAPP" | "EMAIL" | "VISIT" | "NOTE"
  description: string
}) {
  return prisma.$transaction([
    prisma.clientInteraction.create({ data: input, include: { user: true } }),
    prisma.client.update({
      where: { id: input.clientId },
      data: { lastInteractionAt: new Date() },
    }),
  ])
}

export async function upsertClientPreference(
  clientId: string,
  data: Omit<Prisma.ClientPreferenceUncheckedCreateInput, "clientId">
) {
  return prisma.clientPreference.upsert({
    where: { clientId },
    create: { ...data, clientId },
    update: data,
    include: { propertyType: true, city: true, neighborhood: true },
  })
}
