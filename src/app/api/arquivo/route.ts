import { NextResponse } from "next/server"
import type { Session } from "next-auth"

import { auth } from "@/lib/auth"
import { cloudinary } from "@/lib/cloudinary"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { isOwnFileUrl } from "@/lib/own-file"

type User = Session["user"]

// Quem pode abrir: contrato segue a visão de contratos, comprovante exige
// financial.view e documento de captação exige submission.manage.
async function canOpenFile(user: User, url: string): Promise<boolean> {
  const [contract, entry, submission] = await Promise.all([
    prisma.contract.findFirst({
      where: { OR: [{ fileUrl: url }, { attachments: { some: { url } } }] },
      select: { realtorId: true },
    }),
    prisma.financialEntry.findFirst({ where: { attachmentUrl: url }, select: { id: true } }),
    prisma.propertySubmissionFile.findFirst({ where: { url }, select: { id: true } }),
  ])

  if (contract) {
    if (user.realtorId && contract.realtorId === user.realtorId) return true
    return (await can(user, "contract.view.all")) || (await can(user, "contract.manage"))
  }
  if (entry) return can(user, "financial.view")
  if (submission) return can(user, "submission.manage")

  // Acabou de ser enviado e o formulário ainda não foi salvo: vale a pasta.
  if (isOwnFileUrl(url, "contratos")) return can(user, "contract.manage")
  if (isOwnFileUrl(url, "financeiro")) return can(user, "financial.manage")
  return false
}

// Abre um arquivo "raw" (PDF de contrato, comprovante, documento da
// captação) guardado no Cloudinary. O link público dá 401 porque a conta
// bloqueia entrega de PDF — aqui, só pra quem está logado e tem acesso ao
// documento, redireciona pra um link de download autenticado que expira em
// 5 minutos e abre o arquivo no próprio navegador (attachment: false).
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
  if (!(await canOpenFile(session.user, fileUrl))) {
    return new NextResponse("Você não tem acesso a este arquivo.", { status: 403 })
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
