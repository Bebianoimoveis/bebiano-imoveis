import { z } from "zod"

export const siteSettingsInputSchema = z.object({
  phone: z.string().min(8, "Informe um telefone válido."),
  whatsapp: z.string().min(8, "Informe um WhatsApp válido."),
  email: z.email("Informe um e-mail válido."),
  address: z.string().min(5, "Informe o endereço."),
  aboutText: z.string().max(4000).optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
})

export type SiteSettingsInput = z.infer<typeof siteSettingsInputSchema>
