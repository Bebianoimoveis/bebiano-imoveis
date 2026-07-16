// Rate limiter em memória, por processo — suficiente para uma instância
// única, mas não é compartilhado entre múltiplas instâncias serverless
// nem sobrevive a cold starts. Se o tráfego de spam crescer, substituir
// por um limitador com estado externo (ex: Upstash Redis) sem mudar a
// assinatura desta função.
const attemptsByKey = new Map<string, number[]>()

export function isRateLimited(
  key: string,
  { maxAttempts, windowMs }: { maxAttempts: number; windowMs: number }
): boolean {
  const now = Date.now()
  const attempts = (attemptsByKey.get(key) ?? []).filter(
    (timestamp) => now - timestamp < windowMs
  )

  if (attempts.length >= maxAttempts) {
    attemptsByKey.set(key, attempts)
    return true
  }

  attempts.push(now)
  attemptsByKey.set(key, attempts)
  return false
}
