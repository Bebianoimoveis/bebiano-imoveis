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
