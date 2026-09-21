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

// Usado pelo painel admin (cadastro/edição de imóvel, filtros internos) —
// inclui tipos desativados, já que a equipe ainda precisa vê-los pra
// reativar ou pra editar imóveis antigos daquele tipo.
export async function listPropertyTypes() {
  return prisma.propertyType.findMany({ orderBy: { name: "asc" } })
}

// Usado pelo site público (busca, filtros, categorias) — só tipos
// ativos, ver PropertyType.active.
export async function listPublicPropertyTypes() {
  return prisma.propertyType.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  })
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

// Liga/desliga a visibilidade de um tipo de imóvel no site inteiro (busca,
// filtros, listagens, links diretos — ver PUBLIC_WHERE no repository de
// property). Reaproveita "segment.manage" em vez de criar uma permissão
// nova, já que é a mesma responsabilidade de "controlar o que aparece no
// site" da tela de Segmentos.
export async function togglePropertyTypeActive(id: string, active: boolean) {
  const session = await auth()
  if (!(await can(session?.user, "segment.manage"))) {
    throw new Error("Sem permissão para gerenciar tipos de imóvel.")
  }

  await prisma.propertyType.update({ where: { id }, data: { active } })

  revalidatePath("/admin/segmentos")
  revalidatePath("/")
  revalidatePath("/comprar")
  revalidatePath("/alugar")
}

export async function updatePropertyType(id: string, input: unknown) {
  const session = await auth()
  if (!(await can(session?.user, "taxonomy.manage"))) {
    throw new Error("Sem permissão para gerenciar tipos de imóvel.")
  }

  const data = createPropertyTypeSchema.parse(input)
  const propertyType = await prisma.propertyType.update({ where: { id }, data })

  revalidatePath("/admin/segmentos")
  revalidatePath("/admin/imoveis/novo")
  revalidatePath("/")
  revalidatePath("/comprar")
  revalidatePath("/alugar")
  return propertyType
}

// Só permite excluir um tipo sem nenhum imóvel, segmento, preferência de
// cliente ou captação vinculados — apagar isso junto perderia dado real
// (ou violaria a constraint do banco, já que Property.typeId é
// obrigatório). Com vínculo, a saída é desativar em vez de excluir.
export async function deletePropertyType(id: string) {
  const session = await auth()
  if (!(await can(session?.user, "taxonomy.manage"))) {
    throw new Error("Sem permissão para gerenciar tipos de imóvel.")
  }

  const [properties, segments, clientPreferences, submissions] = await Promise.all([
    prisma.property.count({ where: { typeId: id } }),
    prisma.segment.count({ where: { propertyTypeId: id } }),
    prisma.clientPreference.count({ where: { propertyTypeId: id } }),
    prisma.propertySubmission.count({ where: { typeId: id } }),
  ])
  const total = properties + segments + clientPreferences + submissions
  if (total > 0) {
    const parts: string[] = []
    if (properties > 0) parts.push(`${properties} imóvel(is)`)
    if (segments > 0) parts.push(`${segments} segmento(s)`)
    if (clientPreferences > 0) parts.push(`${clientPreferences} preferência(s) de cliente`)
    if (submissions > 0) parts.push(`${submissions} captação(ões)`)
    throw new Error(
      `Este tipo tem ${parts.join(", ")} vinculado(s) e não pode ser excluído — desative em vez de excluir.`
    )
  }

  await prisma.propertyType.delete({ where: { id } })

  revalidatePath("/admin/segmentos")
  revalidatePath("/admin/imoveis/novo")
  revalidatePath("/")
  revalidatePath("/comprar")
  revalidatePath("/alugar")
}
