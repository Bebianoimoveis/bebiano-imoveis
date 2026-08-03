import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

const segmentInclude = {
  propertyType: true,
} satisfies Prisma.SegmentInclude

export type SegmentWithType = Prisma.SegmentGetPayload<{ include: typeof segmentInclude }>

export async function listAllSegments(): Promise<SegmentWithType[]> {
  return prisma.segment.findMany({
    include: segmentInclude,
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  })
}

export async function listActiveSegments(): Promise<SegmentWithType[]> {
  return prisma.segment.findMany({
    where: { active: true },
    include: segmentInclude,
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  })
}

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function generateSegmentSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || "segmento"
  let candidate = base
  let attempt = 1

  while (true) {
    const existing = await prisma.segment.findUnique({ where: { slug: candidate } })
    if (!existing || existing.id === excludeId) break
    attempt += 1
    candidate = `${base}-${attempt}`
  }

  return candidate
}

export async function createSegment(data: Prisma.SegmentCreateInput) {
  return prisma.segment.create({ data, include: segmentInclude })
}

export async function updateSegment(id: string, data: Prisma.SegmentUpdateInput) {
  return prisma.segment.update({ where: { id }, data, include: segmentInclude })
}

export async function deleteSegment(id: string) {
  return prisma.segment.delete({ where: { id } })
}
