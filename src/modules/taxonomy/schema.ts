import { z } from "zod"

export const createCitySchema = z.object({
  name: z.string().min(2, "Informe o nome da cidade."),
  state: z.string().length(2, "Use a sigla do estado (ex: SP)."),
})

export const createNeighborhoodSchema = z.object({
  name: z.string().min(2, "Informe o nome do bairro."),
  cityId: z.string().min(1, "Selecione a cidade."),
})

export const createPropertyTypeSchema = z.object({
  name: z.string().min(2, "Informe o nome do tipo de imóvel."),
})

export const createPropertyFeatureSchema = z.object({
  name: z.string().min(2, "Informe o nome da característica."),
})
