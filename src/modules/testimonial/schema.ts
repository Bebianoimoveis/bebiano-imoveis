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
  name: z.string().min(2, "Informe seu nome.").max(120),
  city: z.string().max(120).optional(),
  rating: z.coerce.number().int().min(1).max(5),
  message: z.string().min(10, "Conte um pouco mais sobre sua experiência.").max(3000),
  highlight: z.string().max(1000).optional(),
  improvementNotes: z.string().max(3000).optional(),
  // Campo-armadilha: invisível pra gente, só bots preenchem formulário
  // via script sem renderizar CSS. Se vier preenchido, descarta em
  // silêncio (ver submitTestimonialReview).
  website: z.string().optional(),
})

export type TestimonialReviewInput = z.infer<typeof testimonialReviewInputSchema>
