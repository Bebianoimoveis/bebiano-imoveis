import { z } from "zod"

export const PROPOSAL_STATUSES = ["OPEN", "ACCEPTED", "REJECTED", "CANCELED"] as const

export const proposalInputSchema = z.object({
  propertyId: z.string().min(1, "Selecione o imóvel."),
  clientId: z.string().min(1, "Selecione o cliente."),
  realtorId: z.string().min(1, "Selecione o corretor."),
  leadId: z.string().optional(),
  value: z.coerce.number().positive("Informe um valor válido."),
  notes: z.string().max(2000).optional(),
})

export type ProposalFormValues = z.input<typeof proposalInputSchema>
export type ProposalInput = z.output<typeof proposalInputSchema>
