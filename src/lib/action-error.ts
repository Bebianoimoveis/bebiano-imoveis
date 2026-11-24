import { USER_ERROR_PREFIX } from "@/lib/user-error"

// Mensagem de um erro vindo de Server Action (ou lançado no navegador).
// Com digest nosso: a mensagem original. Com digest do Next (erro
// inesperado, mascarado em produção): o texto padrão da tela.
export function actionErrorMessage(error: unknown, fallback: string): string {
  const digest = (error as { digest?: unknown } | null)?.digest
  if (typeof digest === "string") {
    return digest.startsWith(USER_ERROR_PREFIX) ? digest.slice(USER_ERROR_PREFIX.length) : fallback
  }
  return error instanceof Error && error.message ? error.message : fallback
}
