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

// Leitura pública — usada pela página "/sobre" (texto institucional
// editável em Configurações, sem dado sensível).
export async function getPublicAboutText() {
  const settings = await settingsRepository.getSettings()
  return settings?.aboutText ?? null
}

// Leitura pública — usada pela seção de Localização da página "/sobre".
export async function getPublicContactInfo() {
  const settings = await settingsRepository.getSettings()
  return {
    phone: settings?.phone ?? null,
    whatsapp: settings?.whatsapp ?? null,
    address: settings?.address ?? null,
    businessHours: settings?.businessHours ?? null,
  }
}

// Leitura pública — imagem de fundo do Hero (home e "/sobre"), editável
// em Configurações. Null = componente usa o fallback embutido.
export async function getPublicHeroImage() {
  const settings = await settingsRepository.getSettings()
  return settings?.heroImageUrl ?? null
}

// Leitura pública — imagem da seção "Nossa História" em "/sobre".
export async function getPublicAboutStoryImage() {
  const settings = await settingsRepository.getSettings()
  return settings?.aboutStoryImageUrl ?? null
}

// Leitura pública — todo o conteúdo editável das seções fixas de
// "/sobre" (ver comentário no schema.prisma). Cada campo é null até
// alguém salvar algo em Configurações; os componentes React já sabem
// cair pro próprio texto padrão quando recebem null/undefined, então
// devolve exatamente o que está no banco, sem resolver o fallback aqui.
export async function getPublicAboutSections() {
  const settings = await settingsRepository.getSettings()
  return {
    stats: (settings?.aboutStats as unknown[] | null) ?? null,
    missionValues: (settings?.aboutMissionValues as Record<string, string> | null) ?? null,
    foundations: (settings?.aboutFoundations as Record<string, unknown> | null) ?? null,
    differentiators: (settings?.aboutDifferentiators as unknown[] | null) ?? null,
    howWeWork: (settings?.aboutHowWeWork as unknown[] | null) ?? null,
    values: (settings?.aboutValues as unknown[] | null) ?? null,
    whyChoose: (settings?.aboutWhyChoose as unknown[] | null) ?? null,
  }
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
    businessHours: data.businessHours || null,
    rentalEnabled: data.rentalEnabled,
    heroImageUrl: data.heroImageUrl || null,
    aboutStoryImageUrl: data.aboutStoryImageUrl || null,
    aboutStats: data.aboutStats,
    aboutMissionValues: data.aboutMissionValues,
    aboutFoundations: data.aboutFoundations,
    aboutDifferentiators: data.aboutDifferentiators,
    aboutHowWeWork: data.aboutHowWeWork,
    aboutValues: data.aboutValues,
    aboutWhyChoose: data.aboutWhyChoose,
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
  // As páginas públicas que leem SiteSettings (Hero da home/Sobre, texto
  // institucional, endereço/mapa/horário do rodapé e da Localização,
  // toggle de Alugar) são Server Components cacheados — sem isso, salvar
  // aqui não refletia nelas até o próximo deploy. "layout" também
  // invalida o Header/Footer (endereço, horário, Alugar), que aparecem
  // em toda página pública, não só na home.
  revalidatePath("/", "layout")
  revalidatePath("/sobre")
  return settings
}
