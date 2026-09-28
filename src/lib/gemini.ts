import { GoogleGenAI } from "@google/genai"

// "-latest" é um alias mantido pelo Google apontando pro modelo flash
// atual — evita ficar preso a uma versão específica que pode ser
// descontinuada (ex.: gemini-2.5-flash já não fica disponível pra
// contas novas, mesmo ainda listado como modelo existente).
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest"

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY)
}

let cachedClient: GoogleGenAI | null = null

// Só instancia quando alguém chama de verdade (nunca no import) — sem
// isso, subir o projeto sem GEMINI_API_KEY configurada quebraria o build/
// dev mesmo pra quem não usa o assistente ainda.
export function getGeminiClient(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY não configurada.")
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  }
  return cachedClient
}

// O Gemini às vezes devolve 503 "modelo com alta demanda" — um pico
// passageiro do lado do Google, não um erro nosso. Poucas tentativas com
// backoff curto resolvem a maioria dos casos sem a pessoa precisar
// tentar de novo ela mesma. Compartilhado entre o assistente de chat e
// qualquer outra chamada ao Gemini (ex: geração de análise sob demanda).
export async function withGeminiRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn()
    } catch (error) {
      const status = (error as { status?: number })?.status
      if (status !== 503 || attempt >= attempts) throw error
      await new Promise((resolve) => setTimeout(resolve, attempt * 800))
    }
  }
}
