"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { logActivity } from "@/lib/activity-log"
import { testimonialInputSchema } from "@/modules/testimonial/schema"
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
