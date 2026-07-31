import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

export async function listAllTestimonials() {
  return prisma.testimonial.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] })
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
