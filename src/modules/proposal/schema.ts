import { z } from "zod"

export const PROPOSAL_STATUSES = [
  "DRAFT",
  "SENT",
  "VIEWED",
  "NEGOTIATING",
  "ACCEPTED",
  "REJECTED",
  "SIGNING",
  "COMPLETED",
  "CANCELED",
] as const

// Criação pelo Wizard — todos os campos financeiros são opcionais além do
// essencial (imóvel/cliente/corretor/valor), preenchidos conforme o
// corretor avança pelos passos.
export const proposalInputSchema = z.object({
  propertyId: z.string().min(1, "Selecione o imóvel."),
  clientId: z.string().min(1, "Selecione o cliente."),
  realtorId: z.string().min(1, "Selecione o corretor."),
  leadId: z.string().optional(),
  value: z.coerce.number().positive("Informe um valor válido."),
  originalValue: z.coerce.number().nonnegative().optional(),
  downPayment: z.coerce.number().nonnegative().optional(),
  financingValue: z.coerce.number().nonnegative().optional(),
  fgtsValue: z.coerce.number().nonnegative().optional(),
  installments: z.coerce.number().int().nonnegative().optional(),
  installmentValue: z.coerce.number().nonnegative().optional(),
  commissionPercent: z.coerce.number().nonnegative().max(100).optional(),
  paymentMethod: z.string().optional(),
  validUntil: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
  status: z.enum(PROPOSAL_STATUSES).optional(),
})

export type ProposalFormValues = z.input<typeof proposalInputSchema>
export type ProposalInput = z.output<typeof proposalInputSchema>

export const proposalFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(PROPOSAL_STATUSES).optional(),
  realtorId: z.string().optional(),
  cityId: z.string().optional(),
  minValue: z.coerce.number().nonnegative().optional(),
  maxValue: z.coerce.number().nonnegative().optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
})

export type ProposalFilters = z.infer<typeof proposalFiltersSchema>

export const proposalInteractionSchema = z.object({
  type: z.enum(["CALL", "WHATSAPP", "EMAIL", "VISIT", "NOTE"]),
  description: z.string().min(1, "Descreva a interação."),
})

export type ProposalInteractionInput = z.infer<typeof proposalInteractionSchema>
