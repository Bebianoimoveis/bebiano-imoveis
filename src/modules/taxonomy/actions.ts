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

// Mesmo padrão de deletePropertyType: só exclui se nada estiver
// vinculado (bairro, imóvel, cliente, preferência, meta, captação) —
// excluir junto perderia dado real ou violaria a constraint do banco
// (Property.cityId é obrigatório). Com vínculo, é preciso desvincular
// antes (ex: excluir os bairros da cidade primeiro).
//
// Devolve o erro como valor (em vez de `throw`) de propósito: uma Server
// Action que lança erro nessa versão do Next tem a mensagem MASCARADA em
// produção (vira "Minified React error #441" sem detalhe nenhum) — só
// `throw` é reservado pra bug de verdade, erro esperado (ex: "ainda tem
// bairro vinculado") precisa voltar como valor pra chegar legível no
// cliente. Ver node_modules/next/dist/docs/01-app/01-getting-started/10-error-handling.md.
export async function deleteCity(id: string): Promise<{ error: string } | undefined> {
  const session = await auth()
  if (!(await can(session?.user, "taxonomy.manage"))) {
    return { error: "Sem permissão para gerenciar cidades." }
  }

  const [neighborhoods, properties, clients, clientPreferences, goals, submissions] = await Promise.all([
    prisma.neighborhood.count({ where: { cityId: id } }),
    prisma.property.count({ where: { cityId: id } }),
    prisma.client.count({ where: { cityId: id } }),
    prisma.clientPreference.count({ where: { cityId: id } }),
    prisma.goal.count({ where: { cityId: id } }),
    prisma.propertySubmission.count({ where: { cityId: id } }),
  ])
  const total = neighborhoods + properties + clients + clientPreferences + goals + submissions
  if (total > 0) {
    const parts: string[] = []
    if (neighborhoods > 0) parts.push(`${neighborhoods} bairro(s)`)
    if (properties > 0) parts.push(`${properties} imóvel(is)`)
    if (clients > 0) parts.push(`${clients} cliente(s)`)
    if (clientPreferences > 0) parts.push(`${clientPreferences} preferência(s) de cliente`)
    if (goals > 0) parts.push(`${goals} meta(s)`)
    if (submissions > 0) parts.push(`${submissions} captação(ões)`)
    return { error: `Esta cidade tem ${parts.join(", ")} vinculado(s) e não pode ser excluída.` }
  }

  await prisma.city.delete({ where: { id } })

  revalidatePath("/admin/taxonomias")
  revalidatePath("/admin/imoveis/novo")
}

export async function createNeighborhood(input: unknown) {
  const session = await auth()
  if (!(await can(session?.user, "taxonomy.manage"))) {
    throw new Error("Sem permissão para gerenciar bairros.")
  }

  const data = createNeighborhoodSchema.parse(input)
  const neighborhood = await prisma.neighborhood.create({ data })

  revalidatePath("/admin/taxonomias")
  revalidatePath("/admin/imoveis/novo")
  return neighborhood
}

// Mesmo padrão de deleteCity: só exclui se nenhum imóvel ou preferência
// de cliente estiver vinculado a esse bairro. Erro esperado volta como
// valor pelo mesmo motivo (ver comentário em deleteCity).
export async function deleteNeighborhood(id: string): Promise<{ error: string } | undefined> {
  const session = await auth()
  if (!(await can(session?.user, "taxonomy.manage"))) {
    return { error: "Sem permissão para gerenciar bairros." }
  }

  const [properties, clientPreferences] = await Promise.all([
    prisma.property.count({ where: { neighborhoodId: id } }),
    prisma.clientPreference.count({ where: { neighborhoodId: id } }),
  ])
  const total = properties + clientPreferences
  if (total > 0) {
    const parts: string[] = []
    if (properties > 0) parts.push(`${properties} imóvel(is)`)
    if (clientPreferences > 0) parts.push(`${clientPreferences} preferência(s) de cliente`)
    return { error: `Este bairro tem ${parts.join(", ")} vinculado(s) e não pode ser excluído.` }
  }

  await prisma.neighborhood.delete({ where: { id } })

  revalidatePath("/admin/taxonomias")
  revalidatePath("/admin/imoveis/novo")
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
// Erro esperado volta como valor pelo mesmo motivo (ver comentário em
// deleteCity): `throw` aqui vira "Minified React error #441" sem
// detalhe nenhum pro usuário em produção.
export async function deletePropertyType(id: string): Promise<{ error: string } | undefined> {
  const session = await auth()
  if (!(await can(session?.user, "taxonomy.manage"))) {
    return { error: "Sem permissão para gerenciar tipos de imóvel." }
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
    return {
      error: `Este tipo tem ${parts.join(", ")} vinculado(s) e não pode ser excluído — desative em vez de excluir.`,
    }
  }

  await prisma.propertyType.delete({ where: { id } })

  revalidatePath("/admin/segmentos")
  revalidatePath("/admin/imoveis/novo")
  revalidatePath("/")
  revalidatePath("/comprar")
  revalidatePath("/alugar")
}
