import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

const submissionInclude = {
  type: true,
  city: true,
  images: { orderBy: { order: "asc" as const } },
  files: { orderBy: { createdAt: "asc" as const } },
  convertedProperty: { select: { id: true, code: true, slug: true } },
} satisfies Prisma.PropertySubmissionInclude

export type SubmissionWithRefs = Prisma.PropertySubmissionGetPayload<{
  include: typeof submissionInclude
}>

export async function listSubmissions(
  where: Prisma.PropertySubmissionWhereInput
): Promise<SubmissionWithRefs[]> {
  return prisma.propertySubmission.findMany({
    where,
    include: submissionInclude,
    orderBy: { createdAt: "desc" },
  })
}

export async function findSubmissionById(id: string): Promise<SubmissionWithRefs | null> {
  return prisma.propertySubmission.findUnique({ where: { id }, include: submissionInclude })
}

export async function createSubmission(data: {
  name: string
  phone: string
  email?: string
  purpose: "SALE" | "RENT"
  typeId?: string
  cityId?: string
  neighborhoodText?: string
  description: string
  askingPrice?: number
  bedrooms?: number
  suites?: number
  bathrooms?: number
  livingRooms?: number
  kitchens?: number
  parkingSpots?: number
  builtArea?: number
  totalArea?: number
  images: string[]
  documents: { url: string; name: string }[]
  features: string[]
  videos: { url: string; name: string }[]
}) {
  return prisma.propertySubmission.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      purpose: data.purpose,
      typeId: data.typeId,
      cityId: data.cityId,
      neighborhoodText: data.neighborhoodText,
      description: data.description,
      askingPrice: data.askingPrice,
      bedrooms: data.bedrooms,
      suites: data.suites,
      bathrooms: data.bathrooms,
      livingRooms: data.livingRooms,
      kitchens: data.kitchens,
      parkingSpots: data.parkingSpots,
      builtArea: data.builtArea,
      totalArea: data.totalArea,
      features: data.features,
      images: {
        create: data.images.map((url, index) => ({ url, order: index })),
      },
      files: {
        create: [
          ...data.documents.map((file) => ({ ...file, kind: "DOCUMENT" as const })),
          ...data.videos.map((file) => ({ ...file, kind: "VIDEO" as const })),
        ],
      },
    },
    include: submissionInclude,
  })
}

export async function updateSubmissionStatus(
  id: string,
  status: "NEW" | "CONTACTED" | "CONVERTED" | "DECLINED",
  notes?: string
) {
  return prisma.propertySubmission.update({
    where: { id },
    data: { status, notes },
    include: submissionInclude,
  })
}

export async function linkConvertedProperty(id: string, propertyId: string) {
  return prisma.propertySubmission.update({
    where: { id },
    data: { status: "CONVERTED", convertedPropertyId: propertyId },
    include: submissionInclude,
  })
}

export async function countNewSubmissions() {
  return prisma.propertySubmission.count({ where: { status: "NEW" } })
}
