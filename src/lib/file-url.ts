// Arquivos "raw" do Cloudinary (PDFs de contrato, comprovantes, documentos
// da captação) não abrem pelo link público: a conta bloqueia a entrega de
// PDF (401 "deny or ACL failure"). Esses passam por /api/arquivo, que exige
// login e gera um link temporário autenticado. Imagens e vídeos seguem
// pelo link direto.
export function fileViewUrl(url: string) {
  if (!url.includes("res.cloudinary.com/") || !url.includes("/raw/upload/")) return url
  return `/api/arquivo?url=${encodeURIComponent(url)}`
}
