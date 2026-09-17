import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

export async function listAllTestimonials() {
  return prisma.testimonial.findMany({
    include: { realtor: { include: { user: true } } },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  })
}

// Lista de corretores ativos + quantos depoimentos cada um já trouxe —
// base da tabela "Links de Avaliação" no admin.
export async function listRealtorsWithTestimonialCounts() {
  const realtors = await prisma.realtor.findMany({
    where: { active: true, deletedAt: null },
    include: { user: true, _count: { select: { testimonials: true } } },
    orderBy: { user: { name: "asc" } },
  })
  return realtors
}

export async function listPublishedTestimonials(take?: number) {
  return prisma.testimonial.findMany({
    where: { published: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    take,
  })
}

export async function createTestimonial(data: Prisma.TestimonialCreateInput) {
  return prisma.testimonial.create({ data })
}

export async function updateTestimonial(id: string, data: Prisma.TestimonialUpdateInput) {
  return prisma.testimonial.update({ where: { id }, data })
}

export async function deleteTestimonial(id: string) {
  return prisma.testimonial.delete({ where: { id } })
}

export async function findActiveRealtorBySlug(slug: string) {
  return prisma.realtor.findFirst({
    where: { slug, active: true, deletedAt: null },
    include: { user: true },
  })
}
