import { z } from "zod"

export const CLIENT_TYPES = ["BUYER", "SELLER", "TENANT", "INVESTOR"] as const
export const CLIENT_STATUSES = ["ACTIVE", "INACTIVE"] as const

// Formulário enxuto de criação — o essencial pra identificar o cliente.
// O resto do perfil (CPF/RG/endereço/nascimento/profissão/estado civil)
// é preenchido depois, na aba "Visão Geral" do drawer, mesmo espírito do
// "Novo Lead" (criação rápida, edição completa depois).
export const clientCreateSchema = z.object({
  name: z.string().min(2, "Informe o nome."),
  phone: z.string().min(8, "Informe um telefone válido."),
  email: z.union([z.email(), z.literal("")]).optional(),
  origin: z.string().optional(),
  types: z.array(z.enum(CLIENT_TYPES)).default([]),
  vip: z.coerce.boolean().default(false),
  realtorId: z.string().optional(),
  cityId: z.string().optional(),
  notes: z.string().max(2000).optional(),
})

export type ClientCreateInput = z.output<typeof clientCreateSchema>

// Edição completa do perfil — aba "Visão Geral" do drawer.
export const clientUpdateSchema = z.object({
  name: z.string().min(2, "Informe o nome.").optional(),
  phone: z.string().min(8, "Informe um telefone válido.").optional(),
  email: z.union([z.email(), z.literal("")]).optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  birthDate: z.coerce.date().optional(),
  profession: z.string().optional(),
  maritalStatus: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  zipCode: z.string().optional(),
  cityId: z.string().nullable().optional(),
  notes: z.string().max(2000).optional(),
  types: z.array(z.enum(CLIENT_TYPES)).optional(),
  status: z.enum(CLIENT_STATUSES).optional(),
  vip: z.coerce.boolean().optional(),
  tags: z.array(z.string()).optional(),
  // undefined = não alterar; null = desvincular; string = atribuir.
  realtorId: z.string().nullable().optional(),
})

export type ClientUpdateInput = z.output<typeof clientUpdateSchema>

export const clientFiltersSchema = z.object({
  search: z.string().optional(),
  cityId: z.string().optional(),
  state: z.string().optional(),
  type: z.enum(CLIENT_TYPES).optional(),
  origin: z.string().optional(),
  realtorId: z.string().optional(),
  status: z.enum(CLIENT_STATUSES).optional(),
  vip: z.coerce.boolean().optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
  lastInteractionFrom: z.coerce.date().optional(),
  lastInteractionTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
})

export type ClientFilters = z.infer<typeof clientFiltersSchema>

export const clientInteractionSchema = z.object({
  type: z.enum(["CALL", "WHATSAPP", "EMAIL", "VISIT", "NOTE"]),
  description: z.string().min(1, "Descreva a interação."),
})

export type ClientInteractionInput = z.infer<typeof clientInteractionSchema>

export const clientPreferenceSchema = z.object({
  propertyTypeId: z.string().nullable().optional(),
  purpose: z.enum(["SALE", "RENT"]).nullable().optional(),
  minValue: z.coerce.number().nonnegative().nullable().optional(),
  maxValue: z.coerce.number().nonnegative().nullable().optional(),
  cityId: z.string().nullable().optional(),
  neighborhoodId: z.string().nullable().optional(),
  bedrooms: z.coerce.number().int().nonnegative().nullable().optional(),
  minArea: z.coerce.number().nonnegative().nullable().optional(),
  pool: z.coerce.boolean().default(false),
  gatedCommunity: z.coerce.boolean().default(false),
  acceptsFinancing: z.coerce.boolean().default(false),
})

export type ClientPreferenceInput = z.output<typeof clientPreferenceSchema>
