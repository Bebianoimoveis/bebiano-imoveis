import { z } from "zod"

export const createUserSchema = z.object({
  name: z.string().min(2, "Informe o nome."),
  email: z.email("Informe um e-mail válido."),
  roleId: z.string().min(1, "Selecione o papel."),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres."),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  name: z.string().min(2, "Informe o nome."),
  email: z.email("Informe um e-mail válido."),
  roleId: z.string().min(1, "Selecione o papel."),
  password: z.union([z.string().min(8), z.literal("")]).optional(),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>
