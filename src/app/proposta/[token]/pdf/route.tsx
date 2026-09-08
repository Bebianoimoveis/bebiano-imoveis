import { readFile } from "fs/promises"
import path from "path"
import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import QRCode from "qrcode"

import { findProposalByShareToken } from "@/modules/proposal/repository"
import { ProposalPdfDocument } from "@/modules/proposal/pdf-document"
import { siteConfig } from "@/config/site"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const proposal = await findProposalByShareToken(token)
  if (!proposal) {
    return NextResponse.json({ error: "Proposta não encontrada." }, { status: 404 })
  }

  let logoBase64: string | null = null
  try {
    const logoBuffer = await readFile(path.join(process.cwd(), "public/images/logo.png"))
    logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`
  } catch {
    logoBase64 = null
  }

  // margin baixo (1 módulo) deixa a zona de silêncio fina demais pra
  // câmera de celular focar em impressão pequena — o próprio spec de QR
  // pede >=4 módulos de quiet zone pra leitura confiável.
  const qrCodeDataUrl = await QRCode.toDataURL(`${siteConfig.url}/proposta/${token}`, {
    width: 240,
    margin: 4,
    errorCorrectionLevel: "H",
  })

  const buffer = await renderToBuffer(
    <ProposalPdfDocument proposal={proposal} logoBase64={logoBase64} qrCodeDataUrl={qrCodeDataUrl} />
  )

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="proposta-${proposal.property.code}.pdf"`,
    },
  })
}
