import { SettingsForm } from "@/components/admin/settings/settings-form"
import { getAdminSettings } from "@/modules/settings/actions"
import { DEFAULT_STORY_TEXT } from "@/components/public/about-story"
import { DEFAULT_STATS } from "@/components/public/about-stats"
import { DEFAULT_MISSION_VALUES } from "@/components/public/about-mission-values"
import { DEFAULT_FOUNDATIONS } from "@/components/public/about-foundations"
import { DEFAULT_DIFFERENTIATORS } from "@/components/public/about-differentiators"
import { DEFAULT_HOW_WE_WORK } from "@/components/public/about-how-we-work"
import { DEFAULT_VALUES } from "@/components/public/about-values-showcase"
import { DEFAULT_WHY_CHOOSE } from "@/components/public/about-why-choose"
import type { SiteSettingsInput } from "@/modules/settings/schema"

export default async function AdminSettingsPage() {
  const settings = await getAdminSettings()
  const socialLinks = (settings?.socialLinks as { instagram?: string; facebook?: string } | null) ?? {}

  const defaultValues: SiteSettingsInput = {
    phone: settings?.phone ?? "",
    whatsapp: settings?.whatsapp ?? "",
    email: settings?.email ?? "",
    address: settings?.address ?? "",
    // Enquanto ninguém preenche esse campo, o site público mostra um
    // texto padrão embutido no código (ver about-story.tsx) — pra não
    // mostrar um campo vazio escondendo o texto que está de verdade no
    // ar, o formulário já abre com esse texto padrão pronto pra editar.
    aboutText: settings?.aboutText ?? DEFAULT_STORY_TEXT,
    businessHours: settings?.businessHours ?? "",
    instagram: socialLinks.instagram ?? "",
    facebook: socialLinks.facebook ?? "",
    rentalEnabled: settings?.rentalEnabled ?? false,
    heroImageUrl: settings?.heroImageUrl ?? "",
    aboutStoryImageUrl: settings?.aboutStoryImageUrl ?? "",
    // Mesma lógica do aboutText acima: cada seção da página Sobre já
    // abre com o conteúdo padrão (o que já está no ar) pronto pra
    // editar, nunca um formulário vazio escondendo o texto real.
    aboutStats: (settings?.aboutStats as SiteSettingsInput["aboutStats"]) ?? DEFAULT_STATS,
    aboutMissionValues:
      (settings?.aboutMissionValues as SiteSettingsInput["aboutMissionValues"]) ?? DEFAULT_MISSION_VALUES,
    aboutFoundations: (settings?.aboutFoundations as SiteSettingsInput["aboutFoundations"]) ?? DEFAULT_FOUNDATIONS,
    aboutDifferentiators:
      (settings?.aboutDifferentiators as SiteSettingsInput["aboutDifferentiators"]) ?? DEFAULT_DIFFERENTIATORS,
    aboutHowWeWork: (settings?.aboutHowWeWork as SiteSettingsInput["aboutHowWeWork"]) ?? DEFAULT_HOW_WE_WORK,
    aboutValues: (settings?.aboutValues as SiteSettingsInput["aboutValues"]) ?? DEFAULT_VALUES,
    aboutWhyChoose: (settings?.aboutWhyChoose as SiteSettingsInput["aboutWhyChoose"]) ?? DEFAULT_WHY_CHOOSE,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Configurações
        </h1>
        <p className="text-sm text-muted-foreground">
          Informações de contato e institucionais usadas no site público.
        </p>
      </div>

      <SettingsForm defaultValues={defaultValues} />
    </div>
  )
}
