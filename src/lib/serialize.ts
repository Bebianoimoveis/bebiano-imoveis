import { Prisma } from "@/generated/prisma/client"

// Next não sabe serializar `Decimal` (classe do Prisma) através da
// fronteira Server Action -> Client Component — isso corrompia o
// restante do payload silenciosamente (campos como enum chegavam vazios
// no client). Usar sempre que uma action devolver um registro com campo
// Decimal (direto ou aninhado em relations) pra um componente client.
type DeepSerialized<T> = T extends Prisma.Decimal
  ? string
  : T extends Date
    ? T
    : T extends (infer U)[]
      ? DeepSerialized<U>[]
      : T extends object
        ? { [K in keyof T]: DeepSerialized<T[K]> }
        : T

export function serializeDecimals<T>(value: T): DeepSerialized<T> {
  if (value instanceof Prisma.Decimal) {
    return value.toString() as DeepSerialized<T>
  }
  if (value instanceof Date) {
    return value as DeepSerialized<T>
  }
  if (Array.isArray(value)) {
    return value.map((item) => serializeDecimals(item)) as DeepSerialized<T>
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      result[key] = serializeDecimals(val)
    }
    return result as DeepSerialized<T>
  }
  return value as DeepSerialized<T>
}
