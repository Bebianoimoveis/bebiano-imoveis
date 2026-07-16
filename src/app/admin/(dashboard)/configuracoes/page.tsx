import { SettingsForm } from "@/components/admin/settings/settings-form"
import { getAdminSettings } from "@/modules/settings/actions"
import type { SiteSettingsInput } from "@/modules/settings/schema"

export default async function AdminSettingsPage() {
  const settings = await getAdminSettings()
  const socialLinks = (settings?.socialLinks as { instagram?: string; facebook?: string } | null) ?? {}

  const defaultValues: SiteSettingsInput = {
    phone: settings?.phone ?? "",
    whatsapp: settings?.whatsapp ?? "",
    email: settings?.email ?? "",
    address: settings?.address ?? "",
    aboutText: settings?.aboutText ?? "",
    instagram: socialLinks.instagram ?? "",
    facebook: socialLinks.facebook ?? "",
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
