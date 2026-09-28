import { SettingsForm } from "@/components/admin/settings/settings-form"
import { getAdminSettings } from "@/modules/settings/actions"
import { DEFAULT_STORY_TEXT } from "@/components/public/about-story"
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
