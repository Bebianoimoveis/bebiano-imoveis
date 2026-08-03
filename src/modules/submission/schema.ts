import { z } from "zod"

export const submissionInputSchema = z.object({
  name: z.string().min(2, "Informe seu nome."),
  phone: z.string().min(8, "Informe um telefone válido."),
  email: z.union([z.email(), z.literal("")]).optional(),
  purpose: z.enum(["SALE", "RENT"]).default("SALE"),
  typeId: z.string().optional(),
  cityId: z.string().optional(),
  neighborhoodText: z.string().optional(),
  description: z.string().min(10, "Descreva o imóvel com mais detalhes."),
  askingPrice: z.coerce.number().nonnegative().optional(),
  images: z.array(z.string()).default([]),
})

export type SubmissionFormValues = z.input<typeof submissionInputSchema>
export type SubmissionInput = z.output<typeof submissionInputSchema>

export const submissionFiltersSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "CONVERTED", "DECLINED"]).optional(),
})

export type SubmissionFilters = z.infer<typeof submissionFiltersSchema>
