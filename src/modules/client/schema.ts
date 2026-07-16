import { z } from "zod"

export const clientInputSchema = z.object({
  name: z.string().min(2, "Informe o nome do cliente."),
  phone: z.string().min(8, "Informe um telefone válido."),
  email: z.union([z.email(), z.literal("")]).optional(),
  notes: z.string().max(2000).optional(),
})

export type ClientInput = z.infer<typeof clientInputSchema>

export const clientFiltersSchema = z.object({
  search: z.string().optional(),
})

export type ClientFilters = z.infer<typeof clientFiltersSchema>
