// Erro esperado, com mensagem pra pessoa ler ("Imóvel não encontrado",
// "Sem permissão..."). Em produção o Next troca a mensagem de qualquer erro
// lançado por uma Server Action por um texto genérico, mas preserva o
// `digest` quando ele já vem preenchido. A mensagem viaja por ali e
// actionErrorMessage (lib/action-error.ts) lê no navegador.
//
// Só use com texto que pode aparecer na tela. Erro inesperado continua
// sendo Error comum e segue mascarado.
export const USER_ERROR_PREFIX = "msg:"

export class UserError extends Error {
  digest: string

  constructor(message: string) {
    super(message)
    this.name = "UserError"
    this.digest = USER_ERROR_PREFIX + message
  }
}
