"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { logActivity } from "@/lib/activity-log"
import { submissionFiltersSchema, submissionInputSchema } from "@/modules/submission/schema"
import * as submissionRepository from "@/modules/submission/repository"

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
    images: data.images,
  })

  revalidatePath("/admin/captacao")
  // Nunca devolver o objeto Prisma inteiro (askingPrice é Decimal) — só
  // o necessário pro client confirmar o envio.
  return { id: submission.id }
}

export async function listAdminSubmissions(rawFilters: unknown = {}) {
  await requireSubmissionManage()
  const filters = submissionFiltersSchema.parse(rawFilters ?? {})
  return submissionRepository.listSubmissions(filters.status ? { status: filters.status } : {})
}

export async function getAdminSubmission(id: string) {
  await requireSubmissionManage()
  return submissionRepository.findSubmissionById(id)
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
