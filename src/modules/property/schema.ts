import { z } from "zod"

// z.coerce.number() converte "" em 0 (Number("") === 0), o que faria um
// campo numérico opcional deixado em branco virar zero em vez de ausente.
// Por isso os inputs desses campos convertem "" em undefined no onChange
// (ver property-form.tsx) antes de chegar aqui — nunca chega "" no coerce.
export const propertyInputSchema = z.object({
  title: z.string().min(5, "O título deve ter ao menos 5 caracteres."),
  description: z.string().min(20, "Descreva o imóvel com mais detalhes."),

  purpose: z.enum(["SALE", "RENT"]),
  typeId: z.string().min(1, "Selecione o tipo do imóvel."),

  price: z.coerce.number().positive("Informe um valor válido."),
  condoFee: z.coerce.number().nonnegative().optional(),
  iptu: z.coerce.number().nonnegative().optional(),

  cityId: z.string().min(1, "Selecione a cidade."),
  neighborhoodId: z.string().min(1, "Selecione o bairro."),

  addressVisibility: z
    .enum(["FULL", "APPROXIMATE", "NEIGHBORHOOD_ONLY"])
    .default("NEIGHBORHOOD_ONLY"),
  street: z.string().optional(),
  number: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),

  builtArea: z.coerce.number().positive().optional(),
  totalArea: z.coerce.number().positive().optional(),
  bedrooms: z.coerce.number().int().nonnegative().default(0),
  suites: z.coerce.number().int().nonnegative().default(0),
  bathrooms: z.coerce.number().int().nonnegative().default(0),
  parkingSpots: z.coerce.number().int().nonnegative().default(0),

  acceptsFinancing: z.coerce.boolean().default(false),
  acceptsFgts: z.coerce.boolean().default(false),
  furnished: z.coerce.boolean().default(false),
  gatedCommunity: z.coerce.boolean().default(false),
  featured: z.coerce.boolean().default(false),

  videoUrl: z.union([z.url(), z.literal("")]).optional(),
  realtorId: z.string().optional(),

  featureIds: z.array(z.string()).default([]),
})

// z.coerce faz o tipo de entrada do schema divergir do tipo de saída
// (ex: price aceita "unknown" na entrada e produz "number" na saída).
// O formulário usa o tipo de entrada (valores ainda não coagidos) e os
// Server Actions usam o tipo de saída (já validado/coagido pelo Zod).
export type PropertyFormValues = z.input<typeof propertyInputSchema>
export type PropertyInput = z.output<typeof propertyInputSchema>

export const propertyFiltersSchema = z.object({
  purpose: z.enum(["SALE", "RENT"]).optional(),
  status: z
    .enum([
      "DRAFT",
      "IN_REVIEW",
      "PUBLISHED",
      "RESERVED",
      "SOLD",
      "RENTED",
      "UNAVAILABLE",
      "ARCHIVED",
    ])
    .optional(),
  cityId: z.string().optional(),
  neighborhoodId: z.string().optional(),
  typeId: z.string().optional(),
  realtorId: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  bedrooms: z.coerce.number().int().nonnegative().optional(),
  suites: z.coerce.number().int().nonnegative().optional(),
  bathrooms: z.coerce.number().int().nonnegative().optional(),
  parkingSpots: z.coerce.number().int().nonnegative().optional(),
  minArea: z.coerce.number().nonnegative().optional(),
  code: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  acceptsFinancing: z.coerce.boolean().optional(),
  acceptsFgts: z.coerce.boolean().optional(),
  furnished: z.coerce.boolean().optional(),
  gatedCommunity: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
})

export type PropertyFilters = z.infer<typeof propertyFiltersSchema>
