import { z } from "zod"

// honeypot: campo invisível para humanos; se vier preenchido, é bot.
// startedAt: timestamp (ms) de quando o formulário foi renderizado — usado
// para rejeitar envios "instantâneos demais" para serem humanos.
export const contactRequestSchema = z.object({
  name: z.string().min(2, "Informe seu nome."),
  phone: z.string().min(8, "Informe um telefone válido."),
  email: z.union([z.email(), z.literal("")]).optional(),
  message: z.string().max(2000).optional(),
  propertyId: z.string().optional(),
  source: z
    .enum(["property_page", "contact_page", "hero_search"])
    .default("property_page"),
  honeypot: z.string().optional(),
  startedAt: z.number(),
})

export type ContactRequestInput = z.infer<typeof contactRequestSchema>

export const LEAD_STAGES = [
  "NEW",
  "FIRST_CONTACT",
  "QUALIFIED",
  "VISIT_SCHEDULED",
  "PROPOSAL",
  "NEGOTIATION",
  "DOCUMENTATION",
  "CLOSED",
  "LOST",
] as const

export const leadUpdateSchema = z.object({
  notes: z.string().max(2000).optional(),
  nextActionAt: z.coerce.date().optional(),
  // undefined = não alterar o corretor; null = desvincular; string = atribuir.
  realtorId: z.string().nullable().optional(),
})

export type LeadUpdateInput = z.output<typeof leadUpdateSchema>

export const leadInteractionSchema = z.object({
  type: z.enum(["CALL", "WHATSAPP", "EMAIL", "VISIT", "NOTE"]),
  description: z.string().min(1, "Descreva a interação."),
})

export type LeadInteractionInput = z.infer<typeof leadInteractionSchema>

export const leadFiltersSchema = z.object({
  stage: z.enum(LEAD_STAGES).optional(),
  realtorId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
})

export type LeadFilters = z.infer<typeof leadFiltersSchema>
