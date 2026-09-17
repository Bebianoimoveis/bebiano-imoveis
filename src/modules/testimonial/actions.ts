"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { logActivity } from "@/lib/activity-log"
import { ensureRealtorSlug } from "@/modules/realtor/service"
import { testimonialInputSchema, testimonialReviewInputSchema } from "@/modules/testimonial/schema"
import * as testimonialRepository from "@/modules/testimonial/repository"

async function requireTestimonialManage() {
  const session = await auth()
  if (!session?.user) throw new Error("Não autenticado.")
  if (!(await can(session.user, "testimonial.manage"))) {
    throw new Error("Sem permissão para gerenciar depoimentos.")
  }
  return session
}

export async function listAdminTestimonials() {
  await requireTestimonialManage()
  return testimonialRepository.listAllTestimonials()
}

// Tabela "Links de Avaliação" no topo da página de Depoimentos — um
// link por corretor, mesmo padrão da página "Links dos Corretores".
export async function listRealtorReviewLinks() {
  await requireTestimonialManage()
  const realtors = await testimonialRepository.listRealtorsWithTestimonialCounts()

  return Promise.all(
    realtors.map(async (realtor) => ({
      id: realtor.id,
      name: realtor.user.name,
      slug: realtor.slug ?? (await ensureRealtorSlug(realtor.id, realtor.user.name)),
      totalReviews: realtor._count.testimonials,
    }))
  )
}

// Leitura pública usada pela página /avaliar/[slug] — sem checagem de
// sessão, só confirma que o corretor existe e está ativo.
export async function getRealtorForReview(slug: string) {
  const realtor = await testimonialRepository.findActiveRealtorBySlug(slug)
  if (!realtor) return null
  return { id: realtor.id, name: realtor.user.name, photoUrl: realtor.photoUrl }
}

// Envio público do formulário de avaliação — sem autenticação. Sempre
// cria oculto (published: false); a Bebiano decide o que publicar em
// /admin/depoimentos.
export async function submitTestimonialReview(input: unknown) {
  const data = testimonialReviewInputSchema.parse(input)

  // Honeypot: bot preencheu o campo invisível — finge sucesso sem
  // gravar nada.
  if (data.website) {
    return { id: "ok" }
  }

  const realtor = await testimonialRepository.findActiveRealtorBySlug(data.realtorSlug)
  if (!realtor) throw new Error("Link de avaliação inválido.")

  const testimonial = await testimonialRepository.createTestimonial({
    name: data.name,
    city: data.city || undefined,
    rating: data.rating,
    message: data.message,
    highlight: data.highlight || undefined,
    improvementNotes: data.improvementNotes || undefined,
    published: false,
    realtor: { connect: { id: realtor.id } },
  })

  revalidatePath("/admin/depoimentos")
  return { id: testimonial.id }
}

// Leitura pública — usada pela home, sem checagem de permissão.
export async function listPublicTestimonials(take = 6) {
  return testimonialRepository.listPublishedTestimonials(take)
}

export async function createTestimonial(input: unknown) {
  const session = await requireTestimonialManage()
  const data = testimonialInputSchema.parse(input)

  const testimonial = await testimonialRepository.createTestimonial(data)

  await logActivity({
    userId: session.user.id,
    action: "testimonial.create",
    entityType: "Testimonial",
    entityId: testimonial.id,
  })

  revalidatePath("/admin/depoimentos")
  revalidatePath("/")
  return { id: testimonial.id }
}

export async function updateTestimonial(id: string, input: unknown) {
  const session = await requireTestimonialManage()
  const data = testimonialInputSchema.partial().parse(input)

  await testimonialRepository.updateTestimonial(id, data)

  await logActivity({
    userId: session.user.id,
    action: "testimonial.edit",
    entityType: "Testimonial",
    entityId: id,
  })

  revalidatePath("/admin/depoimentos")
  revalidatePath("/")
  return { id }
}

export async function deleteTestimonial(id: string) {
  const session = await requireTestimonialManage()
  await testimonialRepository.deleteTestimonial(id)

  await logActivity({
    userId: session.user.id,
    action: "testimonial.delete",
    entityType: "Testimonial",
    entityId: id,
  })

  revalidatePath("/admin/depoimentos")
  revalidatePath("/")
}
