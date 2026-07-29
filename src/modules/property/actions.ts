"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { logActivity } from "@/lib/activity-log"
import { cloudinary } from "@/lib/cloudinary"
import type { Prisma, PropertyStatus } from "@/generated/prisma/client"
import { propertyFiltersSchema, propertyInputSchema } from "@/modules/property/schema"
import type { PropertyImageInput } from "@/modules/property/types"
import * as propertyRepository from "@/modules/property/repository"
import * as propertyService from "@/modules/property/service"

const PAGE_SIZE = 20

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new Error("Não autenticado.")
  return session
}

function revalidatePropertyPaths(slug?: string) {
  revalidatePath("/admin/imoveis")
  revalidatePath("/imoveis")
  // A home é estática por padrão (sem revalidate/dynamic) e mostra
  // "Imóveis em destaque" — sem isso, publicar/despublicar/destacar um
  // imóvel nunca aparecia lá até o próximo deploy.
  revalidatePath("/")
  revalidatePath("/comprar")
  if (slug) revalidatePath(`/imoveis/${slug}`)
}

export async function createProperty(input: unknown) {
  const session = await requireSession()
  if (!(await can(session.user, "property.create"))) {
    throw new Error("Sem permissão para cadastrar imóveis.")
  }

  const data = propertyInputSchema.parse(input)
  const property = await propertyService.createDraftProperty(data, session.user.id)

  await logActivity({
    userId: session.user.id,
    action: "property.create",
    entityType: "Property",
    entityId: property.id,
    metadata: { code: property.code },
  })

  revalidatePropertyPaths()
  // Nunca retornar o objeto Prisma completo para um Client Component: campos
  // Decimal (price, condoFee...) não são serializáveis pelo React Server
  // Actions e quebram silenciosamente a promise no client (ex: router.push
  // após criar nunca executa). Devolver só o que o formulário precisa.
  return { id: property.id }
}

export async function updateProperty(id: string, input: unknown) {
  const session = await requireSession()
  if (!(await can(session.user, "property.edit"))) {
    throw new Error("Sem permissão para editar imóveis.")
  }

  const data = propertyInputSchema.parse(input)
  const property = await propertyService.updatePropertyDetails(id, data)

  await logActivity({
    userId: session.user.id,
    action: "property.edit",
    entityType: "Property",
    entityId: property.id,
  })

  revalidatePropertyPaths(property.slug)
  return { id: property.id }
}

export async function changePropertyStatus(id: string, status: PropertyStatus) {
  const session = await requireSession()

  const requiredPermission = status === "PUBLISHED" ? "property.publish" : "property.edit"
  if (!(await can(session.user, requiredPermission))) {
    throw new Error("Sem permissão para alterar o status deste imóvel.")
  }

  const property = await propertyService.changePropertyStatus(id, status)

  await logActivity({
    userId: session.user.id,
    action: `property.status.${status.toLowerCase()}`,
    entityType: "Property",
    entityId: property.id,
  })

  revalidatePropertyPaths(property.slug)
}

export async function archiveProperty(id: string) {
  const session = await requireSession()
  if (!(await can(session.user, "property.delete"))) {
    throw new Error("Sem permissão para arquivar imóveis.")
  }

  const property = await propertyService.archiveProperty(id)

  await logActivity({
    userId: session.user.id,
    action: "property.archive",
    entityType: "Property",
    entityId: property.id,
  })

  revalidatePropertyPaths()
}

export async function duplicateProperty(id: string) {
  const session = await requireSession()
  if (!(await can(session.user, "property.create"))) {
    throw new Error("Sem permissão para cadastrar imóveis.")
  }

  const duplicate = await propertyService.duplicateProperty(id, session.user.id)

  await logActivity({
    userId: session.user.id,
    action: "property.duplicate",
    entityType: "Property",
    entityId: duplicate.id,
    metadata: { sourceId: id },
  })

  revalidatePropertyPaths()
  return { id: duplicate.id }
}

export async function addPropertyImages(
  propertyId: string,
  images: PropertyImageInput[]
) {
  const session = await requireSession()
  if (!(await can(session.user, "property.edit"))) {
    throw new Error("Sem permissão para editar imagens deste imóvel.")
  }

  const currentCount = await propertyRepository.countImages(propertyId)
  await propertyRepository.addPropertyImages(
    propertyId,
    images.map((image, index) => ({ ...image, order: currentCount + index }))
  )

  if (currentCount === 0 && images[0]) {
    const firstImage = await propertyRepository.findFirstImage(propertyId)
    if (firstImage) {
      await propertyRepository.setCoverImage(propertyId, firstImage.id)
    }
  }

  revalidatePropertyPaths()
}

export async function removePropertyImage(imageId: string) {
  const session = await requireSession()
  if (!(await can(session.user, "property.edit"))) {
    throw new Error("Sem permissão para editar imagens deste imóvel.")
  }

  const image = await propertyRepository.findPropertyImage(imageId)
  if (!image) throw new Error("Imagem não encontrada.")

  await propertyRepository.removePropertyImage(imageId)
  await cloudinary.uploader.destroy(image.publicId).catch(() => {
    // Falha ao remover do Cloudinary não deve impedir a remoção no banco;
    // o arquivo órfão pode ser limpo depois via job de manutenção.
  })

  revalidatePropertyPaths()
}

export async function setCoverImage(propertyId: string, imageId: string) {
  const session = await requireSession()
  if (!(await can(session.user, "property.edit"))) {
    throw new Error("Sem permissão para editar imagens deste imóvel.")
  }

  await propertyRepository.setCoverImage(propertyId, imageId)
  revalidatePropertyPaths()
}

export async function reorderPropertyImages(
  propertyId: string,
  orderedImageIds: string[]
) {
  const session = await requireSession()
  if (!(await can(session.user, "property.edit"))) {
    throw new Error("Sem permissão para editar imagens deste imóvel.")
  }

  await propertyRepository.reorderPropertyImages(propertyId, orderedImageIds)
  revalidatePropertyPaths()
}

function buildCommonWhere(
  filters: ReturnType<typeof propertyFiltersSchema.parse>
): Prisma.PropertyWhereInput {
  return {
    purpose: filters.purpose,
    cityId: filters.cityId,
    neighborhoodId: filters.neighborhoodId,
    typeId: filters.typeId,
    featured: filters.featured,
    acceptsFinancing: filters.acceptsFinancing,
    acceptsFgts: filters.acceptsFgts,
    furnished: filters.furnished,
    gatedCommunity: filters.gatedCommunity,
    code: filters.code ? { contains: filters.code, mode: "insensitive" } : undefined,
    bedrooms: filters.bedrooms ? { gte: filters.bedrooms } : undefined,
    suites: filters.suites ? { gte: filters.suites } : undefined,
    bathrooms: filters.bathrooms ? { gte: filters.bathrooms } : undefined,
    parkingSpots: filters.parkingSpots ? { gte: filters.parkingSpots } : undefined,
    builtArea: filters.minArea ? { gte: filters.minArea } : undefined,
    price:
      filters.minPrice || filters.maxPrice
        ? { gte: filters.minPrice, lte: filters.maxPrice }
        : undefined,
    createdAt:
      filters.createdFrom || filters.createdTo
        ? { gte: filters.createdFrom, lte: filters.createdTo }
        : undefined,
    // Busca única casando título, código, cidade, bairro ou nome do
    // corretor — antes só olhava pra título.
    ...(filters.search
      ? {
          OR: [
            { title: { contains: filters.search, mode: "insensitive" } },
            { code: { contains: filters.search, mode: "insensitive" } },
            { city: { name: { contains: filters.search, mode: "insensitive" } } },
            { neighborhood: { name: { contains: filters.search, mode: "insensitive" } } },
            { realtor: { user: { name: { contains: filters.search, mode: "insensitive" } } } },
          ],
        }
      : {}),
  }
}

async function buildAdminScopedWhere(
  session: Awaited<ReturnType<typeof requireSession>>,
  filters: ReturnType<typeof propertyFiltersSchema.parse>
): Promise<Prisma.PropertyWhereInput> {
  const canViewAll = await can(session.user, "property.view.all")

  return {
    ...buildCommonWhere(filters),
    status: filters.status,
    // Corretores sem property.view.all só enxergam os próprios imóveis.
    // O sentinel garante zero resultados caso o usuário não tenha realtorId.
    realtorId: canViewAll
      ? filters.realtorId
      : (session.user.realtorId ?? "__none__"),
  }
}

export async function listAdminProperties(rawFilters: unknown) {
  const session = await requireSession()
  const filters = propertyFiltersSchema.parse(rawFilters ?? {})
  const where = await buildAdminScopedWhere(session, filters)

  const { items, total } = await propertyRepository.listProperties({
    where,
    skip: (filters.page - 1) * filters.pageSize,
    take: filters.pageSize,
  })

  const ids = items.map((item) => item.id)
  const [leadCounts, lastVisits] = await Promise.all([
    propertyRepository.leadCountsByProperty(ids),
    propertyRepository.lastVisitByProperty(ids),
  ])

  return {
    items: items.map((item) => ({
      ...item,
      leadCount: leadCounts.get(item.id) ?? 0,
      lastVisitAt: lastVisits.get(item.id) ?? null,
    })),
    total,
  }
}

// KPIs do topo do módulo — mesmo escopo por permissão da listagem, mas
// sobre o portfólio inteiro que casa com os filtros ativos (não só a
// página atual).
export async function getPropertyPortfolioStats(rawFilters: unknown) {
  const session = await requireSession()
  const filters = propertyFiltersSchema.parse(rawFilters ?? {})
  const where = await buildAdminScopedWhere(session, filters)

  const [stats, ids] = await Promise.all([
    propertyRepository.getPortfolioStats(where),
    propertyRepository.listPropertyIds(where),
  ])
  const leadCounts = await propertyRepository.leadCountsByProperty(ids)
  const totalLeads = [...leadCounts.values()].reduce((sum, count) => sum + count, 0)

  return { ...stats, totalLeads }
}

// Sugestões instantâneas da busca — só os campos que o dropdown mostra,
// mesmo escopo de permissão da listagem.
export async function suggestProperties(query: string) {
  const session = await requireSession()
  if (query.trim().length < 2) return []

  const canViewAll = await can(session.user, "property.view.all")
  const where: Prisma.PropertyWhereInput = {
    realtorId: canViewAll ? undefined : (session.user.realtorId ?? "__none__"),
    OR: [
      { title: { contains: query, mode: "insensitive" } },
      { code: { contains: query, mode: "insensitive" } },
    ],
  }

  return propertyRepository.suggestProperties(where, 6)
}

async function assertBulkPermission(
  session: Awaited<ReturnType<typeof requireSession>>,
  permission: Parameters<typeof can>[1]
) {
  if (!(await can(session.user, permission))) {
    throw new Error("Sem permissão para executar esta ação.")
  }
}

// Ações em massa reaproveitam as mesmas checagens de permissão das
// versões unitárias — só trocam "um id" por "vários ids" num updateMany.
export async function bulkChangePropertyStatus(ids: string[], status: PropertyStatus) {
  const session = await requireSession()
  await assertBulkPermission(session, status === "PUBLISHED" ? "property.publish" : "property.edit")

  await propertyRepository.bulkUpdateStatus(ids, status)
  await logActivity({
    userId: session.user.id,
    action: `property.bulk_status.${status.toLowerCase()}`,
    entityType: "Property",
    entityId: ids.join(","),
    metadata: { count: ids.length },
  })

  revalidatePropertyPaths()
}

export async function bulkArchiveProperties(ids: string[]) {
  const session = await requireSession()
  await assertBulkPermission(session, "property.delete")

  await propertyRepository.bulkArchive(ids)
  await logActivity({
    userId: session.user.id,
    action: "property.bulk_archive",
    entityType: "Property",
    entityId: ids.join(","),
    metadata: { count: ids.length },
  })

  revalidatePropertyPaths()
}

export async function bulkReassignPropertyRealtor(ids: string[], realtorId: string | null) {
  const session = await requireSession()
  await assertBulkPermission(session, "property.edit")

  await propertyRepository.bulkReassignRealtor(ids, realtorId)
  await logActivity({
    userId: session.user.id,
    action: "property.bulk_reassign_realtor",
    entityType: "Property",
    entityId: ids.join(","),
    metadata: { count: ids.length, realtorId },
  })

  revalidatePropertyPaths()
}

function toCsvValue(value: string | number) {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

// Exporta o resultado filtrado atual (ou só os ids selecionados) como CSV
// — sem biblioteca externa, é só serializar o que já foi buscado.
export async function exportPropertiesCsv(input: { rawFilters?: unknown; ids?: string[] }) {
  const session = await requireSession()

  let where: Prisma.PropertyWhereInput
  if (input.ids && input.ids.length > 0) {
    const canViewAll = await can(session.user, "property.view.all")
    where = {
      id: { in: input.ids },
      realtorId: canViewAll ? undefined : (session.user.realtorId ?? "__none__"),
    }
  } else {
    const filters = propertyFiltersSchema.parse(input.rawFilters ?? {})
    where = await buildAdminScopedWhere(session, filters)
  }

  const { items } = await propertyRepository.listProperties({ where, skip: 0, take: 5000 })

  const header = ["Código", "Título", "Finalidade", "Status", "Preço", "Cidade", "Bairro", "Corretor", "Visualizações"]
  const rows = items.map((item) => [
    item.code,
    item.title,
    item.purpose,
    item.status,
    item.price.toString(),
    item.city.name,
    item.neighborhood.name,
    item.realtor?.user.name ?? "",
    item.viewCount,
  ])

  return [header, ...rows].map((row) => row.map(toCsvValue).join(",")).join("\n")
}

// Uso público — sem autenticação, apenas imóveis publicados e não excluídos.
export async function listPublicProperties(rawFilters: unknown) {
  const filters = propertyFiltersSchema.parse(rawFilters ?? {})

  const where: Prisma.PropertyWhereInput = {
    ...buildCommonWhere(filters),
    status: "PUBLISHED",
  }

  return propertyRepository.listProperties({
    where,
    skip: (filters.page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })
}

// Uso público — sem autenticação. Chamada sob demanda pelo menu mobile
// (só quando ele abre pela primeira vez), não a cada carregamento de
// página — não vale a pena tornar nenhuma página estática em dinâmica
// só por causa desse número.
export async function countPublicProperties() {
  return propertyRepository.countPublishedProperties()
}

// Uso público — sem autenticação. Favoritos são guardados no localStorage
// do visitante (sem conta), então a página de favoritos manda os ids que
// tem aí e a gente busca os imóveis correspondentes (só publicados).
export async function listPropertiesByIds(ids: string[]) {
  if (ids.length === 0) return []

  const { items } = await propertyRepository.listProperties({
    where: { id: { in: ids }, status: "PUBLISHED" },
    skip: 0,
    take: ids.length,
  })
  return items
}

export async function listFeaturedProperties(limit = 6) {
  return propertyRepository.listFeaturedProperties(limit)
}

export async function listRecentProperties(limit = 8) {
  return propertyRepository.listRecentProperties(limit)
}

export async function listSimilarProperties(
  input: { propertyId: string; cityId: string; typeId: string },
  limit = 4
) {
  return propertyRepository.listSimilarProperties(input, limit)
}

export async function getAdminProperty(id: string) {
  const session = await requireSession()
  const property = await propertyRepository.findPropertyById(id)
  if (!property) return null

  const canViewAll = await can(session.user, "property.view.all")
  if (!canViewAll && property.realtorId !== session.user.realtorId) {
    throw new Error("Sem permissão para visualizar este imóvel.")
  }

  return property
}

// Uso público — sem autenticação, apenas imóveis publicados.
export async function getPublicPropertyBySlug(slug: string) {
  return propertyRepository.findPropertyBySlugPublic(slug)
}

// Uso público — sem autenticação. Chamada de "fire and forget" pela
// página do imóvel; falha aqui não deve quebrar a renderização da página.
export async function trackPropertyView(id: string) {
  try {
    await propertyRepository.incrementPropertyViewCount(id)
  } catch {
    // ignora — contagem de visualização não é crítica
  }
}

// Usado no formulário de propostas para localizar um imóvel pelo código
// interno, sem precisar carregar a lista completa de imóveis num select.
export async function findPropertyByCode(code: string) {
  await requireSession()
  const { items } = await propertyRepository.listProperties({
    where: { code: { equals: code, mode: "insensitive" } },
    skip: 0,
    take: 1,
  })
  return items[0] ?? null
}
