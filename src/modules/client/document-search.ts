import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

// CPF/RG ficam gravados do jeito que foram digitados ("123.456.789-00",
// "12345678900", "12.345.678-9"...). Comparando só os dígitos, a busca
// acha o cliente seja qual for a máscara usada no cadastro ou na busca.
export async function findClientIdsByDocument(query: string, limit = 30): Promise<string[]> {
  const digits = query.replace(/[^0-9]/g, "")
  if (digits.length < 3) return []
  const pattern = `%${digits}%`
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Client"
    WHERE "deletedAt" IS NULL
      AND (
        regexp_replace(COALESCE(cpf, ''), '[^0-9]', '', 'g') LIKE ${pattern}
        OR regexp_replace(COALESCE(rg, ''), '[^0-9]', '', 'g') LIKE ${pattern}
      )
    LIMIT ${limit}
  `
  return rows.map((row) => row.id)
}

// Condição "cliente bate com o texto": nome, telefone, e-mail, código,
// CPF ou RG (estes dois só pelos dígitos, via findClientIdsByDocument).
export async function clientMatchWhere(query: string): Promise<Prisma.ClientWhereInput> {
  const q = query.trim()
  const documentIds = await findClientIdsByDocument(q)
  return {
    OR: [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { email: { contains: q, mode: "insensitive" } },
      { code: { contains: q, mode: "insensitive" } },
      { cpf: { contains: q } },
      { rg: { contains: q, mode: "insensitive" } },
      ...(documentIds.length ? [{ id: { in: documentIds } }] : []),
    ],
  }
}

export function clientDocumentsLabel(client: { cpf?: string | null; rg?: string | null }) {
  return [client.cpf ? `CPF ${client.cpf}` : null, client.rg ? `RG ${client.rg}` : null].filter(Boolean).join(" · ")
}
