import { z } from "zod"

export const financialEntryInputSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().min(2, "Informe a categoria."),
  amount: z.coerce.number().positive("Informe um valor válido."),
  dueDate: z.coerce.date(),
  contractId: z.string().optional(),
})

export type FinancialEntryFormValues = z.input<typeof financialEntryInputSchema>
export type FinancialEntryInput = z.output<typeof financialEntryInputSchema>

export const financialFiltersSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  paid: z.enum(["true", "false"]).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
})

export type FinancialFilters = z.infer<typeof financialFiltersSchema>
