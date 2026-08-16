import { z } from "zod"

export const INCOME_CATEGORIES = ["Venda", "Locação", "Comissão", "Consultoria", "Outros"] as const
export const EXPENSE_CATEGORIES = [
  "Marketing",
  "Escritório",
  "Impostos",
  "Tecnologia",
  "Funcionários",
  "Combustível",
  "Outros",
] as const

export const financialEntryInputSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().min(2, "Informe a categoria."),
  description: z.string().optional(),
  amount: z.coerce.number().positive("Informe um valor válido."),
  paidAmount: z.coerce.number().nonnegative().optional(),
  // >1 divide o valor em parcelas mensais na criação (ver createFinancialEntry) —
  // depois de criadas, cada parcela é um FinancialEntry independente, sem
  // vínculo entre si no banco.
  installments: z.coerce.number().int().min(1).max(60).default(1),
  status: z.enum(["PENDING", "SCHEDULED", "PARTIAL", "PAID", "CANCELED"]).default("PENDING"),
  paymentMethod: z.enum(["PIX", "TED", "CARD", "CASH", "BOLETO", "TRANSFER", "CHECK"]).optional(),
  notes: z.string().optional(),
  attachmentUrl: z.string().optional(),
  attachmentName: z.string().optional(),
  dueDate: z.coerce.date(),
  paidAt: z.coerce.date().optional(),
  contractId: z.string().optional(),
  clientId: z.string().optional(),
  realtorId: z.string().optional(),
  propertyId: z.string().optional(),
})

export type FinancialEntryFormValues = z.input<typeof financialEntryInputSchema>
export type FinancialEntryInput = z.output<typeof financialEntryInputSchema>

export const financialFiltersSchema = z.object({
  search: z.string().optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  status: z.enum(["PENDING", "SCHEDULED", "PARTIAL", "PAID", "CANCELED"]).optional(),
  category: z.string().optional(),
  paymentMethod: z.enum(["PIX", "TED", "CARD", "CASH", "BOLETO", "TRANSFER", "CHECK"]).optional(),
  realtorId: z.string().optional(),
  cityId: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
})

export type FinancialFilters = z.infer<typeof financialFiltersSchema>

export const financialEntryInteractionSchema = z.object({
  type: z.enum(["CALL", "WHATSAPP", "EMAIL", "VISIT", "NOTE"]),
  description: z.string().min(2, "Descreva o que aconteceu."),
})
