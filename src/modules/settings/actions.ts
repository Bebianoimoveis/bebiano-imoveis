"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { logActivity } from "@/lib/activity-log"
import { siteSettingsInputSchema } from "@/modules/settings/schema"
import * as settingsRepository from "@/modules/settings/repository"

async function requireSettingsManage() {
  const session = await auth()
  if (!session?.user) throw new Error("Não autenticado.")
  if (!(await can(session.user, "settings.manage"))) {
    throw new Error("Sem permissão para gerenciar configurações.")
  }
  return session
}

export async function getAdminSettings() {
  await requireSettingsManage()
  return settingsRepository.getSettings()
}

export async function updateSettings(input: unknown) {
  const session = await requireSettingsManage()
  const data = siteSettingsInputSchema.parse(input)

  const settings = await settingsRepository.upsertSettings({
    phone: data.phone,
    whatsapp: data.whatsapp,
    email: data.email,
    address: data.address,
    aboutText: data.aboutText || null,
    socialLinks: {
      instagram: data.instagram || undefined,
      facebook: data.facebook || undefined,
    },
  })

  await logActivity({
    userId: session.user.id,
    action: "settings.update",
    entityType: "SiteSettings",
    entityId: settings.id,
  })

  revalidatePath("/admin/configuracoes")
  return settings
}
