import { z } from "zod"

const optionalInt = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v === null ? undefined : v), z.coerce.number().int().min(min).max(max).optional())

const optionalDate = z.preprocess((v) => (v === "" || v === null ? undefined : v), z.coerce.date().optional())

export const goalInputSchema = z
  .object({
    id: z.string().optional(),
    title: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().trim().max(80).optional()),
    scope: z.enum(["COMPANY", "REALTOR", "CITY"]),
    // REVENUE/SALES_VALUE: targetAmount em R$. SALES_COUNT: targetAmount é
    // a quantidade de vendas (número inteiro) — mesmo campo, unidade
    // diferente (ver comentário no schema.prisma).
    metric: z.enum(["SALES_VALUE", "REVENUE", "SALES_COUNT"]).default("SALES_VALUE"),
    period: z.enum(["MONTH", "QUARTER", "YEAR", "YEAR_TO_MONTH", "MONTHLY", "CUSTOM"]).default("MONTH"),
    year: z.coerce.number().int().min(2020).max(2100),
    month: optionalInt(1, 12),
    endMonth: optionalInt(1, 12),
    quarter: optionalInt(1, 4),
    startDate: optionalDate,
    endDate: optionalDate,
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
  .refine((data) => !["MONTH", "YEAR_TO_MONTH", "MONTHLY"].includes(data.period) || Boolean(data.month), {
    message: "Escolha o mês.",
    path: ["month"],
  })
  .refine((data) => data.period !== "QUARTER" || Boolean(data.quarter), {
    message: "Escolha o trimestre.",
    path: ["quarter"],
  })
  .refine((data) => data.period !== "MONTHLY" || !data.endMonth || !data.month || data.endMonth >= data.month, {
    message: "O mês final precisa ser depois do inicial.",
    path: ["endMonth"],
  })
  .refine((data) => data.period !== "CUSTOM" || Boolean(data.startDate && data.endDate), {
    message: "Informe as datas de início e fim.",
    path: ["endDate"],
  })
  .refine(
    (data) => data.period !== "CUSTOM" || !data.startDate || !data.endDate || data.endDate >= data.startDate,
    { message: "A data final precisa ser depois da inicial.", path: ["endDate"] }
  )

export type GoalFormValues = z.input<typeof goalInputSchema>
export type GoalInput = z.output<typeof goalInputSchema>
