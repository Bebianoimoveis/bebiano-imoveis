import { z } from "zod"

export const goalInputSchema = z
  .object({
    scope: z.enum(["COMPANY", "REALTOR", "CITY"]),
    // REVENUE: targetAmount em R$. SALES_COUNT: targetAmount é a
    // quantidade de vendas (número inteiro) — mesmo campo, unidade
    // diferente (ver comentário no schema.prisma).
    metric: z.enum(["REVENUE", "SALES_COUNT"]).default("REVENUE"),
    year: z.coerce.number().int().min(2020).max(2100),
    month: z.coerce.number().int().min(1).max(12).optional(),
    targetAmount: z.coerce.number().positive("Informe um valor de meta válido."),
    realtorId: z.string().optional(),
    cityId: z.string().optional(),
  })
  .refine((data) => data.scope !== "REALTOR" || Boolean(data.realtorId), {
    message: "Selecione o corretor da meta.",
    path: ["realtorId"],
  })
  .refine((data) => data.scope !== "CITY" || Boolean(data.cityId), {
    message: "Selecione a cidade da meta.",
    path: ["cityId"],
  })
  .refine((data) => data.metric !== "SALES_COUNT" || Number.isInteger(data.targetAmount), {
    message: "Quantidade de vendas precisa ser um número inteiro.",
    path: ["targetAmount"],
  })

export type GoalFormValues = z.input<typeof goalInputSchema>
export type GoalInput = z.output<typeof goalInputSchema>
