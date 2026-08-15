import { z } from "zod"

// Criar um corretor cria também a conta de acesso dele (User com papel
// REALTOR) — não existe corretor sem login, é o mesmo vínculo obrigatório
// já modelado no schema (Realtor.userId é obrigatório e único).
export const createRealtorSchema = z.object({
  name: z.string().min(2, "Informe o nome."),
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres."),
  phone: z.string().min(8, "Informe um telefone válido."),
  creci: z.string().optional(),
  bio: z.string().optional(),
  photoUrl: z.string().optional(),
  photoPositionY: z.number().min(0).max(100).optional(),
})

export type CreateRealtorInput = z.infer<typeof createRealtorSchema>

export const updateRealtorSchema = z.object({
  name: z.string().min(2, "Informe o nome."),
  email: z.email("Informe um e-mail válido."),
  phone: z.string().min(8, "Informe um telefone válido."),
  creci: z.string().optional(),
  bio: z.string().optional(),
  photoUrl: z.string().optional(),
  photoPositionY: z.number().min(0).max(100).optional(),
})

export type UpdateRealtorInput = z.infer<typeof updateRealtorSchema>
