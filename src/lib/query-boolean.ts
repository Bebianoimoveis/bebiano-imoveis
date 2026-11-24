import { z } from "zod"

// Filtro booleano vindo da URL. z.coerce.boolean() usa Boolean("false"),
// que é true.
export const queryBoolean = z
  .union([z.boolean(), z.string()])
  .transform((value) => value === true || value === "true" || value === "1")
