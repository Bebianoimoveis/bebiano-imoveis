import { prisma } from "@/lib/prisma"
import { buildPropertySlug } from "@/lib/slug"
import type { Prisma, PropertyStatus } from "@/generated/prisma/client"
import type { PropertyInput } from "@/modules/property/schema"
import * as propertyRepository from "@/modules/property/repository"

class PropertyServiceError extends Error {}

const ALLOWED_TRANSITIONS: Record<PropertyStatus, PropertyStatus[]> = {
  DRAFT: ["IN_REVIEW", "PUBLISHED", "ARCHIVED"],
  IN_REVIEW: ["DRAFT", "PUBLISHED", "ARCHIVED"],
  PUBLISHED: ["RESERVED", "SOLD", "RENTED", "UNAVAILABLE", "DRAFT", "ARCHIVED"],
  RESERVED: ["PUBLISHED", "SOLD", "RENTED", "UNAVAILABLE", "ARCHIVED"],
  SOLD: ["ARCHIVED"],
  RENTED: ["ARCHIVED", "PUBLISHED"],
  UNAVAILABLE: ["PUBLISHED", "ARCHIVED"],
  ARCHIVED: [],
}

async function resolveTaxonomyNames(input: {
  typeId: string
  cityId: string
  neighborhoodId: string
}) {
  const [type, city, neighborhood] = await Promise.all([
    prisma.propertyType.findUniqueOrThrow({ where: { id: input.typeId } }),
    prisma.city.findUniqueOrThrow({ where: { id: input.cityId } }),
    prisma.neighborhood.findUniqueOrThrow({ where: { id: input.neighborhoodId } }),
  ])

  if (neighborhood.cityId !== input.cityId) {
    throw new PropertyServiceError("O bairro selecionado não pertence à cidade escolhida.")
  }

  return { type, city, neighborhood }
}

function toPropertyCreateData(
  input: PropertyInput,
  extra: { code: string; slug: string; createdById: string }
): Prisma.PropertyCreateInput {
  return {
    code: extra.code,
    slug: extra.slug,
    title: input.title,
    description: input.description,
    purpose: input.purpose,
    status: "DRAFT",
    featured: input.featured,
    type: { connect: { id: input.typeId } },
    price: input.price,
    condoFee: input.condoFee,
    iptu: input.iptu,
    city: { connect: { id: input.cityId } },
    neighborhood: { connect: { id: input.neighborhoodId } },
    addressVisibility: input.addressVisibility,
    street: input.street,
    number: input.number,
    latitude: input.latitude,
    longitude: input.longitude,
    builtArea: input.builtArea,
    totalArea: input.totalArea,
    bedrooms: input.bedrooms,
    suites: input.suites,
    bathrooms: input.bathrooms,
    parkingSpots: input.parkingSpots,
    acceptsFinancing: input.acceptsFinancing,
    acceptsFgts: input.acceptsFgts,
    furnished: input.furnished,
    gatedCommunity: input.gatedCommunity,
    videoUrl: input.videoUrl || null,
    realtor: input.realtorId ? { connect: { id: input.realtorId } } : undefined,
    createdBy: { connect: { id: extra.createdById } },
  }
}

function toPropertyUpdateData(input: PropertyInput): Prisma.PropertyUpdateInput {
  return {
    title: input.title,
    description: input.description,
    purpose: input.purpose,
    featured: input.featured,
    type: { connect: { id: input.typeId } },
    price: input.price,
    condoFee: input.condoFee ?? null,
    iptu: input.iptu ?? null,
    city: { connect: { id: input.cityId } },
    neighborhood: { connect: { id: input.neighborhoodId } },
    addressVisibility: input.addressVisibility,
    street: input.street ?? null,
    number: input.number ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    builtArea: input.builtArea ?? null,
    totalArea: input.totalArea ?? null,
    bedrooms: input.bedrooms,
    suites: input.suites,
    bathrooms: input.bathrooms,
    parkingSpots: input.parkingSpots,
    acceptsFinancing: input.acceptsFinancing,
    acceptsFgts: input.acceptsFgts,
    furnished: input.furnished,
    gatedCommunity: input.gatedCommunity,
    videoUrl: input.videoUrl || null,
    realtor: input.realtorId
      ? { connect: { id: input.realtorId } }
      : { disconnect: true },
  }
}

export async function createDraftProperty(
  input: PropertyInput,
  createdById: string
) {
  const { type, city, neighborhood } = await resolveTaxonomyNames(input)
  const code = await propertyRepository.getNextPropertyCode()
  const slug = buildPropertySlug({
    typeName: type.name,
    purpose: input.purpose,
    neighborhoodName: neighborhood.name,
    cityName: city.name,
    code,
  })

  const property = await propertyRepository.createProperty(
    toPropertyCreateData(input, { code, slug, createdById })
  )

  if (input.featureIds.length > 0) {
    await propertyRepository.replacePropertyFeatures(property.id, input.featureIds)
  }

  return property
}

export async function updatePropertyDetails(id: string, input: PropertyInput) {
  const existing = await propertyRepository.findPropertyById(id)
  if (!existing) throw new PropertyServiceError("Imóvel não encontrado.")

  await resolveTaxonomyNames(input)

  const property = await propertyRepository.updateProperty(
    id,
    toPropertyUpdateData(input)
  )
  await propertyRepository.replacePropertyFeatures(id, input.featureIds)

  return property
}

export async function changePropertyStatus(id: string, nextStatus: PropertyStatus) {
  const existing = await propertyRepository.findPropertyById(id)
  if (!existing) throw new PropertyServiceError("Imóvel não encontrado.")

  const allowed = ALLOWED_TRANSITIONS[existing.status]
  if (!allowed.includes(nextStatus)) {
    throw new PropertyServiceError(
      `Não é possível mudar o status de ${existing.status} para ${nextStatus}.`
    )
  }

  if (nextStatus === "PUBLISHED") {
    const imageCount = await propertyRepository.countImages(id)
    if (imageCount === 0) {
      throw new PropertyServiceError(
        "Adicione ao menos uma imagem antes de publicar o imóvel."
      )
    }
  }

  return propertyRepository.updateProperty(id, {
    status: nextStatus,
    publishedAt:
      nextStatus === "PUBLISHED" && !existing.publishedAt
        ? new Date()
        : undefined,
  })
}

export async function archiveProperty(id: string) {
  const existing = await propertyRepository.findPropertyById(id)
  if (!existing) throw new PropertyServiceError("Imóvel não encontrado.")

  return propertyRepository.softDeleteProperty(id)
}

export async function duplicateProperty(id: string, createdById: string) {
  const source = await propertyRepository.findPropertyById(id)
  if (!source) throw new PropertyServiceError("Imóvel não encontrado.")

  const code = await propertyRepository.getNextPropertyCode()
  const slug = buildPropertySlug({
    typeName: source.type.name,
    purpose: source.purpose,
    neighborhoodName: source.neighborhood.name,
    cityName: source.city.name,
    code,
  })

  const duplicate = await propertyRepository.createProperty({
    code,
    slug,
    title: `${source.title} (cópia)`,
    description: source.description,
    purpose: source.purpose,
    status: "DRAFT",
    featured: false,
    type: { connect: { id: source.typeId } },
    price: source.price,
    condoFee: source.condoFee,
    iptu: source.iptu,
    city: { connect: { id: source.cityId } },
    neighborhood: { connect: { id: source.neighborhoodId } },
    addressVisibility: source.addressVisibility,
    street: source.street,
    number: source.number,
    latitude: source.latitude,
    longitude: source.longitude,
    builtArea: source.builtArea,
    totalArea: source.totalArea,
    bedrooms: source.bedrooms,
    suites: source.suites,
    bathrooms: source.bathrooms,
    parkingSpots: source.parkingSpots,
    acceptsFinancing: source.acceptsFinancing,
    acceptsFgts: source.acceptsFgts,
    furnished: source.furnished,
    gatedCommunity: source.gatedCommunity,
    videoUrl: source.videoUrl,
    realtor: source.realtorId ? { connect: { id: source.realtorId } } : undefined,
    createdBy: { connect: { id: createdById } },
  })

  const featureIds = source.features.map((f) => f.featureId)
  if (featureIds.length > 0) {
    await propertyRepository.replacePropertyFeatures(duplicate.id, featureIds)
  }

  if (source.images.length > 0) {
    await propertyRepository.addPropertyImages(
      duplicate.id,
      source.images.map((image, index) => ({
        url: image.url,
        publicId: image.publicId,
        order: index,
      }))
    )
  }

  return duplicate
}

export { PropertyServiceError }
