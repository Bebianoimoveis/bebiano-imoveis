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

// Leitura pública — usada só pelo endereço/mapa do rodapé, sem checagem
// de permissão (o endereço da imobiliária não é dado sensível).
export async function getPublicSiteAddress() {
  const settings = await settingsRepository.getSettings()
  return settings?.address ?? null
}

// Leitura pública — controla se "Alugar" aparece na navegação/busca do
// site público (menu, rodapé, toggle do Hero). Hoje a imobiliária só
// trabalha com venda; ativar aqui não exige deploy.
export async function getPublicRentalEnabled() {
  const settings = await settingsRepository.getSettings()
  return settings?.rentalEnabled ?? false
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
    rentalEnabled: data.rentalEnabled,
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
