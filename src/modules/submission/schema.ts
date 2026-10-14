import { z } from "zod"

// Campo em branco no formulário chega como undefined (ver
// property-submission-form) — "não informado", diferente de 0.
const quantity = z.number().int().min(0).max(99).optional()
const area = z.number().positive().max(999999).optional()

// Só URLs do nosso Cloudinary — o formulário é público, então não aceita
// link arbitrário enviado direto pra action.
const fileSchema = z.object({
  url: z.string().startsWith("https://res.cloudinary.com/"),
  name: z.string().min(1).max(200),
})

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
  bedrooms: quantity,
  suites: quantity,
  bathrooms: quantity,
  livingRooms: quantity,
  kitchens: quantity,
  parkingSpots: quantity,
  builtArea: area,
  totalArea: area,
  images: z.array(z.string()).default([]),
  documents: z.array(fileSchema).max(20).default([]),
  videos: z.array(fileSchema).max(10).default([]),
})

export type SubmissionFormValues = z.input<typeof submissionInputSchema>
export type SubmissionInput = z.output<typeof submissionInputSchema>

export const submissionFiltersSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "CONVERTED", "DECLINED"]).optional(),
})

export type SubmissionFilters = z.infer<typeof submissionFiltersSchema>
