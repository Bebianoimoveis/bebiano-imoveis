import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

export async function getSettings() {
  return prisma.siteSettings.findFirst()
}

// SiteSettings é um singleton — nunca deve existir mais de um registro.
export async function upsertSettings(
  data: Omit<Prisma.SiteSettingsCreateInput, "id">
) {
  const existing = await prisma.siteSettings.findFirst({ select: { id: true } })

  if (existing) {
    return prisma.siteSettings.update({ where: { id: existing.id }, data })
  }

  return prisma.siteSettings.create({ data })
}
