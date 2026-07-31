import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

const adminListInclude = {
  type: true,
  city: true,
  neighborhood: true,
  realtor: { include: { user: true } },
  images: { orderBy: { order: "asc" as const } },
} satisfies Prisma.PropertyInclude

const detailInclude = {
  ...adminListInclude,
  features: { include: { feature: true } },
} satisfies Prisma.PropertyInclude

export type PropertyListItem = Prisma.PropertyGetPayload<{
  include: typeof adminListInclude
}>

export type PropertyDetail = Prisma.PropertyGetPayload<{
  include: typeof detailInclude
}>

// O código é gerado a partir do último imóvel criado (incluindo os
// excluídos logicamente, para nunca reutilizar um código já emitido).
export async function getNextPropertyCode(): Promise<string> {
  const last = await prisma.property.findFirst({
    orderBy: { createdAt: "desc" },
    select: { code: true },
  })

  const lastNumber = last ? Number(last.code.replace(/\D/g, "")) : 1000
  const nextNumber = Number.isFinite(lastNumber) ? lastNumber + 1 : 1001

  return `BB-${nextNumber}`
}

export async function createProperty(
  data: Prisma.PropertyCreateInput
): Promise<PropertyDetail> {
  return prisma.property.create({ data, include: detailInclude })
}

export async function updateProperty(
  id: string,
  data: Prisma.PropertyUpdateInput
): Promise<PropertyDetail> {
  return prisma.property.update({ where: { id }, data, include: detailInclude })
}

export async function findPropertyById(
  id: string
): Promise<PropertyDetail | null> {
  return prisma.property.findFirst({
    where: { id, deletedAt: null },
    include: detailInclude,
  })
}

export async function findPropertyBySlugPublic(
  slug: string
): Promise<PropertyDetail | null> {
  return prisma.property.findFirst({
    where: { slug, deletedAt: null, status: "PUBLISHED" },
    include: detailInclude,
  })
}

export async function incrementPropertyViewCount(id: string) {
  await prisma.property.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  })
}

type ListPropertiesParams = {
  where: Prisma.PropertyWhereInput
  skip: number
  take: number
  orderBy?: Prisma.PropertyOrderByWithRelationInput
}

export async function listProperties({
  where,
  skip,
  take,
  orderBy,
}: ListPropertiesParams): Promise<{ items: PropertyListItem[]; total: number }> {
  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where: { ...where, deletedAt: null },
      include: adminListInclude,
      orderBy: orderBy ?? { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.property.count({ where: { ...where, deletedAt: null } }),
  ])

  return { items, total }
}

// Contagem pura, sem buscar os itens — usada pelo resumo de credibilidade
// do menu mobile ("N imóveis disponíveis").
export function countPublishedProperties(): Promise<number> {
  return prisma.property.count({ where: { status: "PUBLISHED", deletedAt: null } })
}

// KPIs do portfólio — um total por status (inclusive os que a listagem
// pública nunca usa, como DRAFT/ARCHIVED) mais os agregados de valor e
// visualizações. `where` já vem com o escopo de corretor aplicado pelo
// chamador, igual ao resto das queries deste módulo.
export async function getPortfolioStats(where: Prisma.PropertyWhereInput) {
  const base = { ...where, deletedAt: null }

  // Arquivar sempre grava `deletedAt` (é a mesma soft-delete de sempre),
  // então uma contagem de ARCHIVED que exclui `deletedAt` nunca acharia
  // nada — por isso essa contagem roda à parte, sem esse filtro.
  const [byStatus, archivedCount, valueAgg, viewsAgg] = await Promise.all([
    prisma.property.groupBy({
      by: ["status"],
      where: base,
      _count: true,
    }),
    prisma.property.count({ where: { ...where, status: "ARCHIVED" } }),
    prisma.property.aggregate({
      where: { ...base, status: "PUBLISHED" },
      _sum: { price: true },
    }),
    prisma.property.aggregate({
      where: base,
      _sum: { viewCount: true },
    }),
  ])

  const countByStatus = {
    ...Object.fromEntries(byStatus.map((row) => [row.status, row._count])),
    ARCHIVED: archivedCount,
  } as Record<string, number>

  return {
    total: byStatus.reduce((sum, row) => sum + row._count, 0),
    countByStatus,
    totalValue: valueAgg._sum.price ?? 0,
    totalViews: viewsAgg._sum.viewCount ?? 0,
  }
}

// Só os ids que casam com o filtro — usado pra agregar métricas (leads
// totais do portfólio) sem arrastar o include pesado de `listProperties`.
export async function listPropertyIds(where: Prisma.PropertyWhereInput) {
  const rows = await prisma.property.findMany({
    where: { ...where, deletedAt: null },
    select: { id: true },
  })
  return rows.map((row) => row.id)
}

// Leads e última visita por imóvel — usados só na listagem, então
// calculados em lote pros ids da página atual (nunca pro portfólio
// inteiro) para não pesar a query principal.
export async function leadCountsByProperty(propertyIds: string[]) {
  if (propertyIds.length === 0) return new Map<string, number>()

  const groups = await prisma.lead.groupBy({
    by: ["propertyId"],
    where: { propertyId: { in: propertyIds }, deletedAt: null },
    _count: true,
  })

  return new Map(groups.filter((g) => g.propertyId).map((g) => [g.propertyId as string, g._count]))
}

export async function lastVisitByProperty(propertyIds: string[]) {
  if (propertyIds.length === 0) return new Map<string, Date>()

  const groups = await prisma.appointment.groupBy({
    by: ["propertyId"],
    where: { propertyId: { in: propertyIds } },
    _max: { scheduledAt: true },
  })

  return new Map(
    groups
      .filter((g) => g.propertyId && g._max.scheduledAt)
      .map((g) => [g.propertyId as string, g._max.scheduledAt as Date])
  )
}

// Ações em massa — a mesma checagem de permissão do chamador (actions.ts)
// já decide quem pode chegar aqui; este módulo só executa.
export async function bulkUpdateStatus(ids: string[], status: Prisma.PropertyUpdateManyMutationInput["status"]) {
  return prisma.property.updateMany({ where: { id: { in: ids } }, data: { status } })
}

export async function bulkArchive(ids: string[]) {
  return prisma.property.updateMany({
    where: { id: { in: ids } },
    data: { deletedAt: new Date(), status: "ARCHIVED" },
  })
}

export async function bulkReassignRealtor(ids: string[], realtorId: string | null) {
  return prisma.property.updateMany({ where: { id: { in: ids } }, data: { realtorId } })
}

// Sugestões rápidas da busca (topo do input) — bem mais barato que a
// listagem completa, só os campos usados no dropdown.
export async function suggestProperties(where: Prisma.PropertyWhereInput, take: number) {
  return prisma.property.findMany({
    where: { ...where, deletedAt: null },
    select: { id: true, code: true, title: true, city: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take,
  })
}

export async function softDeleteProperty(id: string) {
  return prisma.property.update({
    where: { id },
    data: { deletedAt: new Date(), status: "ARCHIVED" },
  })
}

export async function replacePropertyFeatures(
  propertyId: string,
  featureIds: string[]
) {
  await prisma.propertyFeatureOnProperty.deleteMany({ where: { propertyId } })
  if (featureIds.length === 0) return

  await prisma.propertyFeatureOnProperty.createMany({
    data: featureIds.map((featureId) => ({ propertyId, featureId })),
  })
}

export async function addPropertyImages(
  propertyId: string,
  images: { url: string; publicId: string; order: number }[]
) {
  await prisma.propertyImage.createMany({
    data: images.map((image) => ({ ...image, propertyId })),
  })
}

export async function findPropertyImage(imageId: string) {
  return prisma.propertyImage.findUnique({ where: { id: imageId } })
}

export async function removePropertyImage(imageId: string) {
  return prisma.propertyImage.delete({ where: { id: imageId } })
}

export async function setCoverImage(propertyId: string, imageId: string) {
  await prisma.$transaction([
    prisma.propertyImage.updateMany({
      where: { propertyId },
      data: { isCover: false },
    }),
    prisma.propertyImage.update({
      where: { id: imageId },
      data: { isCover: true },
    }),
  ])
}

export async function reorderPropertyImages(
  propertyId: string,
  orderedImageIds: string[]
) {
  await prisma.$transaction(
    orderedImageIds.map((imageId, index) =>
      prisma.propertyImage.update({
        where: { id: imageId, propertyId },
        data: { order: index },
      })
    )
  )
}

export async function countImages(propertyId: string) {
  return prisma.propertyImage.count({ where: { propertyId } })
}

export async function findFirstImage(propertyId: string) {
  return prisma.propertyImage.findFirst({
    where: { propertyId },
    orderBy: { order: "asc" },
  })
}

const PUBLIC_WHERE = {
  status: "PUBLISHED",
  deletedAt: null,
} satisfies Prisma.PropertyWhereInput

export async function listFeaturedProperties(
  take: number
): Promise<PropertyListItem[]> {
  return prisma.property.findMany({
    where: { ...PUBLIC_WHERE, featured: true },
    include: adminListInclude,
    orderBy: { publishedAt: "desc" },
    take,
  })
}

export async function listRecentProperties(
  take: number
): Promise<PropertyListItem[]> {
  return prisma.property.findMany({
    where: PUBLIC_WHERE,
    include: adminListInclude,
    orderBy: { publishedAt: "desc" },
    take,
  })
}

export async function listPublicPropertiesByRealtor(
  realtorId: string,
  take: number
): Promise<PropertyListItem[]> {
  return prisma.property.findMany({
    where: { ...PUBLIC_WHERE, realtorId },
    include: adminListInclude,
    orderBy: { publishedAt: "desc" },
    take,
  })
}

export async function listLaunchProperties(
  take: number
): Promise<PropertyListItem[]> {
  return prisma.property.findMany({
    where: { ...PUBLIC_WHERE, isLaunch: true },
    include: adminListInclude,
    orderBy: { publishedAt: "desc" },
    take,
  })
}

export async function listSimilarProperties(
  input: { propertyId: string; cityId: string; typeId: string },
  take: number
): Promise<PropertyListItem[]> {
  return prisma.property.findMany({
    where: {
      ...PUBLIC_WHERE,
      id: { not: input.propertyId },
      OR: [{ cityId: input.cityId }, { typeId: input.typeId }],
    },
    include: adminListInclude,
    orderBy: { publishedAt: "desc" },
    take,
  })
}
