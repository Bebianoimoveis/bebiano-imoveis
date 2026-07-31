"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ensureRealtorSlug } from "@/modules/realtor/service"

// Leitura simples usada para popular o seletor de corretor no formulário
// de imóveis. O CRUD completo de corretores é um módulo à parte, ainda
// não implementado.
export async function listRealtors() {
  const session = await auth()
  if (!session?.user) throw new Error("Não autenticado.")

  return prisma.realtor.findMany({
    where: { active: true, deletedAt: null },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  })
}

// Leitura pública — seção "Equipe" da home, sem checagem de sessão. Gera o
// slug na hora (mesmo padrão já usado no painel "Links dos Corretores")
// pra nunca deixar um corretor de fora só porque ainda não tem slug.
export async function listPublicRealtors() {
  const realtors = await prisma.realtor.findMany({
    where: { active: true, deletedAt: null },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  })

  return Promise.all(
    realtors.map(async (realtor) => ({
      ...realtor,
      slug: realtor.slug ?? (await ensureRealtorSlug(realtor.id, realtor.user.name)),
    }))
  )
}

export async function getPublicRealtorBySlug(slug: string) {
  const realtor = await prisma.realtor.findUnique({
    where: { slug },
    include: { user: true },
  })
  if (!realtor || !realtor.active || realtor.deletedAt) return null

  const [propertyCount, soldOrRentedCount] = await Promise.all([
    prisma.property.count({
      where: { realtorId: realtor.id, status: "PUBLISHED", deletedAt: null },
    }),
    prisma.contract.count({
      where: { realtorId: realtor.id, status: "COMPLETED" },
    }),
  ])

  return { ...realtor, propertyCount, soldOrRentedCount }
}
