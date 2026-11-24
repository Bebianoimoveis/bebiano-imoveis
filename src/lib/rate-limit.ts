import { createHash } from "node:crypto"

import { prisma } from "@/lib/prisma"

// Limite de tentativas guardado no banco, então vale pra todas as
// instâncias do servidor (antes era um contador por processo, que cada
// instância nova zerava). A chave é guardada como hash: não fica e-mail
// nem IP legível na tabela. Se o banco falhar (ou a tabela ainda não
// existir), cai pro contador em memória em vez de derrubar o formulário.
type Options = { maxAttempts: number; windowMs: number }

const memory = new Map<string, number[]>()
let databaseOffUntil = 0

function limitedInMemory(key: string, { maxAttempts, windowMs }: Options): boolean {
  const now = Date.now()
  const attempts = (memory.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs)
  if (attempts.length >= maxAttempts) {
    memory.set(key, attempts)
    return true
  }
  attempts.push(now)
  memory.set(key, attempts)
  return false
}

export async function isRateLimited(key: string, options: Options): Promise<boolean> {
  const hashed = createHash("sha256").update(key).digest("hex")
  if (Date.now() < databaseOffUntil) return limitedInMemory(hashed, options)

  const now = new Date()
  const resetAt = new Date(now.getTime() + options.windowMs)
  try {
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimitBucket" ("key", "count", "resetAt") VALUES (${hashed}, 1, ${resetAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimitBucket"."resetAt" <= ${now} THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimitBucket"."resetAt" <= ${now} THEN EXCLUDED."resetAt" ELSE "RateLimitBucket"."resetAt" END
      RETURNING "count"
    `
    // De vez em quando apaga as janelas vencidas, pra tabela não crescer.
    if (Math.random() < 0.01) {
      await prisma.$executeRaw`DELETE FROM "RateLimitBucket" WHERE "resetAt" < ${now}`.catch(() => null)
    }
    return Number(rows[0]?.count ?? 0) > options.maxAttempts
  } catch (error) {
    console.error("rate-limit: usando memória", error instanceof Error ? error.message.slice(0, 120) : error)
    databaseOffUntil = Date.now() + 5 * 60 * 1000
    return limitedInMemory(hashed, options)
  }
}
