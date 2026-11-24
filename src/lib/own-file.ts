import { UserError } from "@/lib/user-error"

// Arquivos são enviados direto do navegador e só a URL chega aqui; sem esta
// checagem dava pra gravar o link de qualquer site como "contrato assinado".
export function isOwnFileUrl(url: string, folder?: string): boolean {
  const base = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`
  if (!url.startsWith(base)) return false
  return folder ? decodeURIComponent(url).includes(`/bebiano-imoveis/${folder}/`) : true
}

export function assertOwnFileUrl(url: string | null | undefined) {
  if (url && !isOwnFileUrl(url)) throw new UserError("Arquivo inválido. Envie o arquivo de novo.")
}
