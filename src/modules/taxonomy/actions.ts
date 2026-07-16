"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import {
  createCitySchema,
  createNeighborhoodSchema,
  createPropertyFeatureSchema,
  createPropertyTypeSchema,
} from "@/modules/taxonomy/schema"

// Listas de taxonomia (cidade, bairro, tipo, característica) não contêm
// dado sensível — são usadas tanto pelos selects do painel quanto pelos
// filtros do site público, por isso a leitura não exige autenticação.

export async function listCities() {
  return prisma.city.findMany({ orderBy: { name: "asc" } })
}

export async function listNeighborhoods(cityId: string) {
  return prisma.neighborhood.findMany({
    where: { cityId },
    orderBy: { name: "asc" },
  })
}

export async function listPropertyTypes() {
  return prisma.propertyType.findMany({ orderBy: { name: "asc" } })
}

export async function listPropertyFeatures() {
  return prisma.propertyFeature.findMany({ orderBy: { name: "asc" } })
}

// Escrita é restrita a quem gerencia taxonomias (ADMIN/MANAGER por padrão).

export async function createCity(input: unknown) {
  const session = await auth()
  if (!(await can(session?.user, "taxonomy.manage"))) {
    throw new Error("Sem permissão para gerenciar cidades.")
  }

  const data = createCitySchema.parse(input)
  const city = await prisma.city.create({
    data: { name: data.name, state: data.state.toUpperCase() },
  })

  revalidatePath("/admin/imoveis/novo")
  return city
}

export async function createNeighborhood(input: unknown) {
  const session = await auth()
  if (!(await can(session?.user, "taxonomy.manage"))) {
    throw new Error("Sem permissão para gerenciar bairros.")
  }

  const data = createNeighborhoodSchema.parse(input)
  const neighborhood = await prisma.neighborhood.create({ data })

  revalidatePath("/admin/imoveis/novo")
  return neighborhood
}

export async function createPropertyType(input: unknown) {
  const session = await auth()
  if (!(await can(session?.user, "taxonomy.manage"))) {
    throw new Error("Sem permissão para gerenciar tipos de imóvel.")
  }

  const data = createPropertyTypeSchema.parse(input)
  const propertyType = await prisma.propertyType.create({ data })

  revalidatePath("/admin/imoveis/novo")
  return propertyType
}

export async function createPropertyFeature(input: unknown) {
  const session = await auth()
  if (!(await can(session?.user, "taxonomy.manage"))) {
    throw new Error("Sem permissão para gerenciar características.")
  }

  const data = createPropertyFeatureSchema.parse(input)
  const feature = await prisma.propertyFeature.create({ data })

  revalidatePath("/admin/imoveis/novo")
  return feature
}
