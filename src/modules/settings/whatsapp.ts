import { siteConfig } from "@/config/site"
import * as settingsRepository from "@/modules/settings/repository"

// WhatsApp da imobiliária: o salvo em Configurações; sem ele, o do ambiente.
export async function getPublicWhatsapp(): Promise<string> {
  const settings = await settingsRepository.getSettings()
  return settings?.whatsapp || siteConfig.whatsapp
}
