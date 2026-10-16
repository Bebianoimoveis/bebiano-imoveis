"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { logActivity } from "@/lib/activity-log"
import { isRateLimited } from "@/lib/rate-limit"
import { submissionFiltersSchema, submissionInputSchema } from "@/modules/submission/schema"
import * as submissionRepository from "@/modules/submission/repository"
import type { SubmissionWithRefs } from "@/modules/submission/repository"

async function getClientIp() {
  const headerList = await headers()
  const forwardedFor = headerList.get("x-forwarded-for")
  return forwardedFor?.split(",")[0]?.trim() ?? "unknown"
}

async function requireSubmissionManage() {
  const session = await auth()
  if (!session?.user) throw new Error("Não autenticado.")
  if (!(await can(session.user, "submission.manage"))) {
    throw new Error("Sem permissão para gerenciar captações.")
  }
  return session
}

// Uso público — formulário "Quero vender meu imóvel", sem autenticação.
export async function createPropertySubmission(input: unknown) {
  const ip = await getClientIp()
  if (isRateLimited(`submission:${ip}`, { maxAttempts: 5, windowMs: 10 * 60 * 1000 })) {
    throw new Error("Muitos envios em pouco tempo. Aguarde alguns minutos e tente novamente.")
  }

  const data = submissionInputSchema.parse(input)

  const submission = await submissionRepository.createSubmission({
    name: data.name,
    phone: data.phone,
    email: data.email || undefined,
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
    images: data.images,
    documents: data.documents,
    features: data.features,
    videos: data.videos,
  })

  revalidatePath("/admin/captacao")
  // Nunca devolver o objeto Prisma inteiro (askingPrice é Decimal) — só
  // o necessário pro client confirmar o envio.
  return { id: submission.id }
}

// Decimal (valor, áreas) vira string: o resultado atravessa a fronteira
// Server Action/Server Component → Client Component, e instância de
// Decimal não é serializável ali.
function serializeSubmission(submission: SubmissionWithRefs) {
  return {
    ...submission,
    askingPrice: submission.askingPrice?.toString() ?? null,
    builtArea: submission.builtArea?.toString() ?? null,
    totalArea: submission.totalArea?.toString() ?? null,
  }
}

export type SubmissionDetail = ReturnType<typeof serializeSubmission>

export async function listAdminSubmissions(rawFilters: unknown = {}) {
  await requireSubmissionManage()
  const filters = submissionFiltersSchema.parse(rawFilters ?? {})
  const submissions = await submissionRepository.listSubmissions(
    filters.status ? { status: filters.status } : {}
  )
  return submissions.map(serializeSubmission)
}

export async function getAdminSubmission(id: string) {
  await requireSubmissionManage()
  const submission = await submissionRepository.findSubmissionById(id)
  return submission ? serializeSubmission(submission) : null
}

export async function countNewSubmissions() {
  await requireSubmissionManage()
  return submissionRepository.countNewSubmissions()
}

export async function updateSubmissionStatus(
  id: string,
  status: "NEW" | "CONTACTED" | "CONVERTED" | "DECLINED",
  notes?: string
) {
  const session = await requireSubmissionManage()
  await submissionRepository.updateSubmissionStatus(id, status, notes)

  await logActivity({
    userId: session.user.id,
    action: `submission.status.${status.toLowerCase()}`,
    entityType: "PropertySubmission",
    entityId: id,
  })

  revalidatePath("/admin/captacao")
}

// Chamado depois que a equipe cria o Property de verdade a partir da
// captação (o cadastro em si acontece pelo formulário normal de imóvel,
// já pré-preenchido com estes dados — ver instrução no admin) — este
// vínculo só marca a captação como convertida e aponta pro imóvel criado.
export async function linkSubmissionToProperty(id: string, propertyId: string) {
  const session = await requireSubmissionManage()
  await submissionRepository.linkConvertedProperty(id, propertyId)

  await logActivity({
    userId: session.user.id,
    action: "submission.converted",
    entityType: "PropertySubmission",
    entityId: id,
    metadata: { propertyId },
  })

  revalidatePath("/admin/captacao")
}
