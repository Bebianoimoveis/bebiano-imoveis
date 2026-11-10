import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { cloudinary } from "@/lib/cloudinary"

// Abre um arquivo "raw" (PDF de contrato, comprovante, documento da
// captação) guardado no Cloudinary. O link público dá 401 porque a conta
// bloqueia entrega de PDF — aqui, só pra quem está logado, redireciona
// pra um link de download autenticado que expira em 5 minutos e abre o
// arquivo no próprio navegador (attachment: false).
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return new NextResponse("Faça login no painel para abrir este arquivo.", { status: 401 })
  }

  const fileUrl = new URL(request.url).searchParams.get("url") ?? ""
  const prefix = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/`
  if (!fileUrl.startsWith(prefix)) {
    return new NextResponse("Arquivo inválido.", { status: 400 })
  }

  // ".../raw/upload/v1794322116/pasta/arquivo.pdf" → "pasta/arquivo.pdf"
  // (em arquivo raw o public_id inclui a extensão).
  const publicId = decodeURIComponent(fileUrl.slice(prefix.length).replace(/^v\d+\//, ""))

  const signedUrl = cloudinary.utils.private_download_url(publicId, "", {
    resource_type: "raw",
    type: "upload",
    attachment: false,
    expires_at: Math.floor(Date.now() / 1000) + 5 * 60,
  })

  return NextResponse.redirect(signedUrl)
}
