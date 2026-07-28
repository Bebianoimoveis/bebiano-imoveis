"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

export type GlobalSearchResult = {
  type: "property" | "lead" | "client"
  id: string
  title: string
  subtitle: string
  href: string
}

// Busca global da topbar (⌘K) — mesmo escopo de visibilidade já usado
// nas listagens de cada módulo (corretor sem "*.view.all" só encontra o
// que é dele), não uma busca separada com regras próprias.
export async function globalSearch(query: string): Promise<GlobalSearchResult[]> {
  const session = await auth()
  if (!session?.user) return []

  const q = query.trim()
  if (q.length < 2) return []

  const realtorScope = session.user.realtorId ?? "__none__"
  const [canViewAllProperties, canViewAllLeads, canManageClients] = await Promise.all([
    can(session.user, "property.view.all"),
    can(session.user, "lead.view.all"),
    can(session.user, "client.manage"),
  ])

  const [properties, leads, clients] = await Promise.all([
    prisma.property.findMany({
      where: {
        deletedAt: null,
        ...(canViewAllProperties ? {} : { realtorId: realtorScope }),
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { code: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, code: true },
      take: 5,
    }),
    prisma.lead.findMany({
      where: {
        deletedAt: null,
        ...(canViewAllLeads ? {} : { realtorId: realtorScope }),
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
        ],
      },
      select: { id: true, name: true, phone: true },
      take: 5,
    }),
    canManageClients
      ? prisma.client.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
            ],
          },
          select: { id: true, name: true, phone: true },
          take: 5,
        })
      : Promise.resolve([]),
  ])

  return [
    ...properties.map((property) => ({
      type: "property" as const,
      id: property.id,
      title: property.title,
      subtitle: property.code,
      href: `/admin/imoveis/${property.id}`,
    })),
    ...leads.map((lead) => ({
      type: "lead" as const,
      id: lead.id,
      title: lead.name,
      subtitle: lead.phone,
      href: `/admin/leads/${lead.id}`,
    })),
    ...clients.map((client) => ({
      type: "client" as const,
      id: client.id,
      title: client.name,
      subtitle: client.phone,
      href: `/admin/clientes?search=${encodeURIComponent(client.name)}`,
    })),
  ]
}
