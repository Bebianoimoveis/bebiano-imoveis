"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { logActivity } from "@/lib/activity-log"
import { prisma } from "@/lib/prisma"
import { segmentInputSchema } from "@/modules/segment/schema"
import * as segmentRepository from "@/modules/segment/repository"

async function requireSegmentManage() {
  const session = await auth()
  if (!session?.user) throw new Error("Não autenticado.")
  if (!(await can(session.user, "segment.manage"))) {
    throw new Error("Sem permissão para gerenciar segmentos.")
  }
  return session
}

export async function listAdminSegments() {
  await requireSegmentManage()
  return segmentRepository.listAllSegments()
}

// Leitura pública — banners de categoria da home, sem checagem de sessão.
// Resolve uma imagem de exibição pra cada segmento: usa a própria
// imageUrl se cadastrada, senão cai pra capa de um imóvel publicado real
// que bate com o filtro do segmento (nunca uma foto de estoque genérica).
export async function listPublicSegments() {
  const segments = await segmentRepository.listActiveSegments()

  return Promise.all(
    segments.map(async (segment) => {
      if (segment.imageUrl) {
        return { ...segment, resolvedImageUrl: segment.imageUrl }
      }

      const hasFilter =
        segment.propertyTypeId || segment.purpose || segment.isLaunch || segment.gatedCommunity || segment.minPrice

      if (!hasFilter) return { ...segment, resolvedImageUrl: null }

      const property = await prisma.property.findFirst({
        where: {
          status: "PUBLISHED",
          deletedAt: null,
          type: { active: true },
          typeId: segment.propertyTypeId ?? undefined,
          purpose: segment.purpose ?? undefined,
          isLaunch: segment.isLaunch || undefined,
          gatedCommunity: segment.gatedCommunity || undefined,
          price: segment.minPrice ? { gte: segment.minPrice } : undefined,
        },
        orderBy: { publishedAt: "desc" },
        select: {
          images: { orderBy: [{ isCover: "desc" }, { order: "asc" }], take: 1, select: { url: true } },
        },
      })

      return { ...segment, resolvedImageUrl: property?.images[0]?.url ?? null }
    })
  )
}

export async function createSegment(input: unknown) {
  const session = await requireSegmentManage()
  const data = segmentInputSchema.parse(input)
  const slug = await segmentRepository.generateSegmentSlug(data.name)

  const segment = await segmentRepository.createSegment({
    name: data.name,
    slug,
    active: data.active,
    order: data.order,
    icon: data.icon,
    imageUrl: data.imageUrl,
    propertyType: data.propertyTypeId ? { connect: { id: data.propertyTypeId } } : undefined,
    purpose: data.purpose,
    isLaunch: data.isLaunch,
    gatedCommunity: data.gatedCommunity,
    minPrice: data.minPrice,
  })

  await logActivity({
    userId: session.user.id,
    action: "segment.create",
    entityType: "Segment",
    entityId: segment.id,
  })

  revalidatePath("/admin/segmentos")
  revalidatePath("/")
  return { id: segment.id }
}

export async function updateSegment(id: string, input: unknown) {
  const session = await requireSegmentManage()
  const data = segmentInputSchema.partial().parse(input)

  await segmentRepository.updateSegment(id, {
    name: data.name,
    active: data.active,
    order: data.order,
    icon: data.icon,
    imageUrl: data.imageUrl,
    propertyType: data.propertyTypeId
      ? { connect: { id: data.propertyTypeId } }
      : data.propertyTypeId === ""
        ? { disconnect: true }
        : undefined,
    purpose: data.purpose,
    isLaunch: data.isLaunch,
    gatedCommunity: data.gatedCommunity,
    minPrice: data.minPrice,
  })

  await logActivity({
    userId: session.user.id,
    action: "segment.edit",
    entityType: "Segment",
    entityId: id,
  })

  revalidatePath("/admin/segmentos")
  revalidatePath("/")
  return { id }
}

export async function toggleSegmentActive(id: string, active: boolean) {
  const session = await requireSegmentManage()
  await segmentRepository.updateSegment(id, { active })

  await logActivity({
    userId: session.user.id,
    action: active ? "segment.activate" : "segment.deactivate",
    entityType: "Segment",
    entityId: id,
  })

  revalidatePath("/admin/segmentos")
  revalidatePath("/")
}

export async function deleteSegment(id: string) {
  const session = await requireSegmentManage()
  await segmentRepository.deleteSegment(id)

  await logActivity({
    userId: session.user.id,
    action: "segment.delete",
    entityType: "Segment",
    entityId: id,
  })

  revalidatePath("/admin/segmentos")
  revalidatePath("/")
}
