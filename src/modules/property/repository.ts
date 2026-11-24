import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

const adminListInclude = {
  type: true,
  city: true,
  neighborhood: true,
  realtor: { include: { user: { select: { id: true, name: true } } } },
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
// Pelo maior número, não pelo mais recente: um código cadastrado fora de
// ordem fazia o próximo repetir um já usado.
export async function getNextPropertyCode(): Promise<string> {
  const [row] = await prisma.$queryRaw<{ last: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING("code" FROM 4) AS INTEGER)) AS last
    FROM "Property" WHERE "code" ~ '^BB-[0-9]{1,9}$'`
  return `BB-${(row?.last ?? 1000) + 1}`
}

// Dois cadastros ao mesmo tempo podem calcular o mesmo código; o banco
// recusa o segundo (código único) e ele tenta de novo com o seguinte.
export async function withNextPropertyCode<T>(create: (code: string) => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await create(await getNextPropertyCode())
    } catch (error) {
      if (attempt >= 5 || (error as { code?: string }).code !== "P2002") throw error
    }
  }
}

export async function findPropertyOwnership(id: string) {
  return prisma.property.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, realtorId: true, createdById: true, isLaunch: true },
  })
}

export async function findCodesByIds(ids: string[]) {
  const rows = await prisma.property.findMany({ where: { id: { in: ids } }, select: { id: true, code: true } })
  return new Map(rows.map((row) => [row.id, row.code]))
}

export async function countImagesByPublicId(publicId: string) {
  return prisma.propertyImage.count({ where: { publicId } })
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

// Leitura mínima usada na resolução de corretor responsável ao criar um
// lead (ver lead/service.ts) — evita puxar o include completo do imóvel
// só para pegar um campo.
export async function findPropertyRealtorId(id: string): Promise<string | null> {
  const property = await prisma.property.findUnique({
    where: { id },
    select: { realtorId: true },
  })
  return property?.realtorId ?? null
}

export async function findPropertyBySlugPublic(
  slug: string
): Promise<PropertyDetail | null> {
  return prisma.property.findFirst({
    // type.active: se o tipo do imóvel foi desativado (ver Segment/toggle
    // no admin), o imóvel some do site público inteiro, inclusive por
    // link direto — não só dos banners/busca.
    where: { slug, deletedAt: null, status: "PUBLISHED", type: { active: true } },
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
  orderBy?: Prisma.PropertyOrderByWithRelationInput | Prisma.PropertyOrderByWithRelationInput[]
}

export async function listProperties({
  where,
  skip,
  take,
  orderBy,
}: ListPropertiesParams): Promise<{ items: PropertyListItem[]; total: number }> {
  // Arquivar grava `deletedAt` (soft-delete) — filtrar `deletedAt: null`
  // incondicionalmente escondia os arquivados mesmo pedindo
  // status=ARCHIVED explicitamente (o card "Arquivados" do portfólio
  // levava pra uma lista sempre vazia).
  const scopedWhere = where.status === "ARCHIVED" ? where : { ...where, deletedAt: null }

  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where: scopedWhere,
      include: adminListInclude,
      orderBy: orderBy ?? { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.property.count({ where: scopedWhere }),
  ])

  return { items, total }
}

// Contagem pura, sem buscar os itens — usada pelo resumo de credibilidade
// do menu mobile ("N imóveis disponíveis").
export function countPublishedProperties(): Promise<number> {
  return prisma.property.count({ where: { status: "PUBLISHED", deletedAt: null } })
}

// Leitura mínima usada pelo sitemap.xml — só o que precisa pra montar
// a URL e o lastModified, sem puxar o resto do imóvel.
export function listPublicPropertySlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  return prisma.property.findMany({
    where: { status: "PUBLISHED", deletedAt: null, type: { active: true } },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  })
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

// Checagem antes de excluir de vez — leads/propostas/contratos/
// financeiro apontando pro imóvel viram histórico do negócio, não dá
// pra apagar sem perder rastro dessas relações.
export async function countPropertyDependents(id: string) {
  const [leads, appointments, proposals, contracts, financialEntries] = await Promise.all([
    prisma.lead.count({ where: { propertyId: id } }),
    prisma.appointment.count({ where: { propertyId: id } }),
    prisma.proposal.count({ where: { propertyId: id } }),
    prisma.contract.count({ where: { propertyId: id } }),
    prisma.financialEntry.count({ where: { propertyId: id } }),
  ])
  return { leads, appointments, proposals, contracts, financialEntries }
}

export async function hardDeleteProperty(id: string) {
  return prisma.property.delete({ where: { id } })
}

// Existência simples, sem excluir arquivados (diferente de
// findPropertyById) — excluir de vez só faz sentido justamente pra quem
// já está arquivado, então o `deletedAt: null` de lá sempre acharia
// "não encontrado" pra esse caso.
export async function propertyExists(id: string) {
  const property = await prisma.property.findUnique({ where: { id }, select: { id: true } })
  return property !== null
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

// type.active: imóvel de um tipo desativado (ver PropertyType.active /
// toggle de segmento no admin) some do site público inteiro.
const PUBLIC_WHERE = {
  status: "PUBLISHED",
  deletedAt: null,
  type: { active: true },
} satisfies Prisma.PropertyWhereInput

// Cartões públicos por id (favoritos do visitante), só com os campos
// exibidos. select explícito de propósito: campo novo no Property não
// passa a ser público sozinho.
export async function listPublicPropertyCards(ids: string[]) {
  const rows = await prisma.property.findMany({
    where: { ...PUBLIC_WHERE, id: { in: ids } },
    select: {
      id: true,
      slug: true,
      title: true,
      purpose: true,
      featured: true,
      bedrooms: true,
      bathrooms: true,
      parkingSpots: true,
      pool: true,
      availableUnits: true,
      publishedAt: true,
      createdAt: true,
      price: true,
      city: { select: { name: true } },
      neighborhood: { select: { name: true } },
      images: { orderBy: { order: "asc" }, select: { url: true, isCover: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return rows.map((row) => ({ ...row, price: row.price.toString() }))
}

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

// Destaque sempre na frente nas listagens públicas, antes de qualquer
// outro critério — é o propósito do campo "featured".
const FEATURED_FIRST_ORDER = [{ featured: "desc" }, { publishedAt: "desc" }] satisfies Prisma.PropertyOrderByWithRelationInput[]

export async function listRecentProperties(
  take: number
): Promise<PropertyListItem[]> {
  return prisma.property.findMany({
    where: PUBLIC_WHERE,
    include: adminListInclude,
    orderBy: FEATURED_FIRST_ORDER,
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
    orderBy: FEATURED_FIRST_ORDER,
    take,
  })
}

export async function listLaunchProperties(
  take: number
): Promise<PropertyListItem[]> {
  return prisma.property.findMany({
    where: { ...PUBLIC_WHERE, isLaunch: true },
    include: adminListInclude,
    orderBy: FEATURED_FIRST_ORDER,
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
    orderBy: FEATURED_FIRST_ORDER,
    take,
  })
}
