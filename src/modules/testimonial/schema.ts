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

// Formulário público de avaliação (/avaliar/[slug]) — sem campo
// `published`: todo envio de cliente entra oculto, a Bebiano decide o
// que vai pro site (ver comentário no model Testimonial).
export const testimonialReviewInputSchema = z.object({
  realtorSlug: z.string().min(1),
  name: z.string().min(2, "Informe seu nome."),
  city: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  message: z.string().min(10, "Conte um pouco mais sobre sua experiência."),
  highlight: z.string().optional(),
  improvementNotes: z.string().optional(),
  // Campo-armadilha: invisível pra gente, só bots preenchem formulário
  // via script sem renderizar CSS. Se vier preenchido, descarta em
  // silêncio (ver submitTestimonialReview).
  website: z.string().max(0).optional().or(z.literal("")),
})

export type TestimonialReviewInput = z.infer<typeof testimonialReviewInputSchema>
