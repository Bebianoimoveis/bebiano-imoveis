import { prisma } from "@/lib/prisma"
import { buildPropertySlug } from "@/lib/slug"
import type { Prisma, PropertyStatus } from "@/generated/prisma/client"
import type { PropertyInput } from "@/modules/property/schema"
import * as propertyRepository from "@/modules/property/repository"
import { PROPERTY_STATUS_LABELS } from "@/modules/property/types"
import { UserError } from "@/lib/user-error"

class PropertyServiceError extends UserError {}

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
    isLaunch: input.isLaunch,
    launchDeliveryAt: input.launchDeliveryAt,
    type: { connect: { id: input.typeId } },
    price: input.price,
    condoFee: input.condoFee,
    iptu: input.iptu,
    city: { connect: { id: input.cityId } },
    neighborhood: { connect: { id: input.neighborhoodId } },
    addressVisibility: input.addressVisibility,
    zipCode: input.zipCode,
    street: input.street,
    number: input.number,
    latitude: input.latitude,
    longitude: input.longitude,
    builtArea: input.builtArea,
    totalArea: input.totalArea,
    availableUnits: input.availableUnits,
    bedrooms: input.bedrooms,
    suites: input.suites,
    bathrooms: input.bathrooms,
    parkingSpots: input.parkingSpots,
    acceptsFinancing: input.acceptsFinancing,
    acceptsFgts: input.acceptsFgts,
    furnished: input.furnished,
    gatedCommunity: input.gatedCommunity,
    pool: input.pool,
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
    isLaunch: input.isLaunch,
    launchDeliveryAt: input.launchDeliveryAt ?? null,
    type: { connect: { id: input.typeId } },
    price: input.price,
    condoFee: input.condoFee ?? null,
    iptu: input.iptu ?? null,
    city: { connect: { id: input.cityId } },
    neighborhood: { connect: { id: input.neighborhoodId } },
    addressVisibility: input.addressVisibility,
    zipCode: input.zipCode ?? null,
    street: input.street ?? null,
    number: input.number ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    builtArea: input.builtArea ?? null,
    totalArea: input.totalArea ?? null,
    availableUnits: input.availableUnits ?? null,
    bedrooms: input.bedrooms,
    suites: input.suites,
    bathrooms: input.bathrooms,
    parkingSpots: input.parkingSpots,
    acceptsFinancing: input.acceptsFinancing,
    acceptsFgts: input.acceptsFgts,
    furnished: input.furnished,
    gatedCommunity: input.gatedCommunity,
    pool: input.pool,
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
  const property = await propertyRepository.withNextPropertyCode((code) => {
    const slug = buildPropertySlug({
      typeName: type.name,
      purpose: input.purpose,
      neighborhoodName: neighborhood.name,
      cityName: city.name,
      code,
    })
    return propertyRepository.createProperty(toPropertyCreateData(input, { code, slug, createdById }))
  })

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
      `Não é possível mudar o status de ${PROPERTY_STATUS_LABELS[existing.status]} para ${PROPERTY_STATUS_LABELS[nextStatus]}.`
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

  // Arquivar é sempre a exclusão lógica; só o status deixava o imóvel
  // arquivado aparecendo nas listas.
  if (nextStatus === "ARCHIVED") return propertyRepository.softDeleteProperty(id)

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

// Exclusão de verdade (diferente de arquivar): só permitida se o imóvel
// não tiver nenhum lead/agendamento/proposta/contrato/lançamento
// financeiro vinculado — apagar isso junto perderia histórico real do
// negócio. Nesses casos a saída é arquivar em vez de excluir.
export async function deleteProperty(id: string) {
  const exists = await propertyRepository.propertyExists(id)
  if (!exists) throw new PropertyServiceError("Imóvel não encontrado.")

  const dependents = await propertyRepository.countPropertyDependents(id)
  const total = Object.values(dependents).reduce((sum, n) => sum + n, 0)
  if (total > 0) {
    const parts: string[] = []
    if (dependents.leads > 0) parts.push(`${dependents.leads} lead(s)`)
    if (dependents.appointments > 0) parts.push(`${dependents.appointments} compromisso(s)`)
    if (dependents.proposals > 0) parts.push(`${dependents.proposals} proposta(s)`)
    if (dependents.contracts > 0) parts.push(`${dependents.contracts} contrato(s)`)
    if (dependents.financialEntries > 0) parts.push(`${dependents.financialEntries} lançamento(s) financeiro(s)`)
    throw new PropertyServiceError(
      `Este imóvel tem ${parts.join(", ")} vinculado(s) e não pode ser excluído — arquive em vez de excluir.`
    )
  }

  return propertyRepository.hardDeleteProperty(id)
}

// realtorId undefined = mantém o corretor do original.
export async function duplicateProperty(id: string, createdById: string, realtorId?: string | null) {
  const source = await propertyRepository.findPropertyById(id)
  if (!source) throw new PropertyServiceError("Imóvel não encontrado.")

  const ownerId = realtorId === undefined ? source.realtorId : realtorId
  const duplicate = await propertyRepository.withNextPropertyCode((code) => propertyRepository.createProperty({
    code,
    slug: buildPropertySlug({
      typeName: source.type.name,
      purpose: source.purpose,
      neighborhoodName: source.neighborhood.name,
      cityName: source.city.name,
      code,
    }),
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
    zipCode: source.zipCode,
    street: source.street,
    number: source.number,
    latitude: source.latitude,
    longitude: source.longitude,
    builtArea: source.builtArea,
    totalArea: source.totalArea,
    availableUnits: source.availableUnits,
    bedrooms: source.bedrooms,
    suites: source.suites,
    bathrooms: source.bathrooms,
    parkingSpots: source.parkingSpots,
    acceptsFinancing: source.acceptsFinancing,
    acceptsFgts: source.acceptsFgts,
    furnished: source.furnished,
    gatedCommunity: source.gatedCommunity,
    pool: source.pool,
    videoUrl: source.videoUrl,
    realtor: ownerId ? { connect: { id: ownerId } } : undefined,
    createdBy: { connect: { id: createdById } },
  }))

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
