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

// Mesma proteção anti-spam do formulário de contato (honeypot + time-trap).
export const visitRequestSchema = z.object({
  name: z.string().min(2, "Informe seu nome."),
  phone: z.string().min(8, "Informe um telefone válido."),
  propertyId: z.string().min(1),
  preferredDate: z.string().min(1, "Escolha uma data."),
  preferredTime: z.string().min(1, "Escolha um horário."),
  message: z.string().max(2000).nullish(),
  honeypot: z.string().optional(),
  startedAt: z.number(),
})

export type VisitRequestInput = z.infer<typeof visitRequestSchema>

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
  temperature: z.enum(["HOT", "WARM", "COLD"]).optional(),
  vip: z.coerce.boolean().optional(),
  tags: z.array(z.string()).optional(),
})

export type LeadUpdateInput = z.output<typeof leadUpdateSchema>

export const leadInteractionSchema = z.object({
  type: z.enum(["CALL", "WHATSAPP", "EMAIL", "VISIT", "NOTE"]),
  description: z.string().min(1, "Descreva a interação."),
})

export type LeadInteractionInput = z.infer<typeof leadInteractionSchema>

export const LEAD_TEMPERATURES = ["HOT", "WARM", "COLD"] as const

export const leadFiltersSchema = z.object({
  stage: z.enum(LEAD_STAGES).optional(),
  realtorId: z.string().optional(),
  cityId: z.string().optional(),
  origin: z.string().optional(),
  temperature: z.enum(LEAD_TEMPERATURES).optional(),
  minValue: z.coerce.number().nonnegative().optional(),
  maxValue: z.coerce.number().nonnegative().optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
  lastInteractionFrom: z.coerce.date().optional(),
  lastInteractionTo: z.coerce.date().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
})

export type LeadFilters = z.infer<typeof leadFiltersSchema>

// Criação manual pelo admin (Ctrl+N / botão "Novo Lead") — não existia
// nenhum jeito de cadastrar um lead sem ser via formulário público até
// esta entrega.
export const leadCreateSchema = z.object({
  name: z.string().min(2, "Informe o nome."),
  phone: z.string().min(8, "Informe um telefone válido."),
  email: z.union([z.email(), z.literal("")]).optional(),
  origin: z.string().min(1).default("site"),
  propertyId: z.string().optional(),
  realtorId: z.string().optional(),
  stage: z.enum(LEAD_STAGES).default("NEW"),
  temperature: z.enum(LEAD_TEMPERATURES).default("WARM"),
  vip: z.coerce.boolean().default(false),
})

export type LeadCreateInput = z.output<typeof leadCreateSchema>
