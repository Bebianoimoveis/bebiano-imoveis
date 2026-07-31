import { z } from "zod"

export const testimonialInputSchema = z.object({
  name: z.string().min(2, "Informe o nome."),
  city: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  message: z.string().min(10, "O depoimento precisa ter pelo menos 10 caracteres."),
  photoUrl: z.string().optional(),
  published: z.boolean().default(true),
  order: z.coerce.number().int().default(0),
})

export type TestimonialFormValues = z.input<typeof testimonialInputSchema>
export type TestimonialInput = z.output<typeof testimonialInputSchema>
