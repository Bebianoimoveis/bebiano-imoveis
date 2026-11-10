import { readFile } from "fs/promises"
import path from "path"
import { renderToBuffer } from "@react-pdf/renderer"
import QRCode from "qrcode"

import { ProposalPdfDocument } from "@/modules/proposal/pdf-document"
import type { ProposalDetail } from "@/modules/proposal/repository"
import { siteConfig } from "@/config/site"

// Gera o PDF da proposta (o mesmo do link "PDF" que vai pro cliente).
// Usado pela rota pública /proposta/[token]/pdf e pra anexar a proposta
// aprovada no contrato na hora da conversão.
export async function renderProposalPdf(proposal: ProposalDetail): Promise<Buffer> {
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
  const qrCodeDataUrl = await QRCode.toDataURL(
    proposal.shareToken ? `${siteConfig.url}/proposta/${proposal.shareToken}` : siteConfig.url,
    { width: 240, margin: 4, errorCorrectionLevel: "H" }
  )

  return renderToBuffer(
    <ProposalPdfDocument proposal={proposal} logoBase64={logoBase64} qrCodeDataUrl={qrCodeDataUrl} />
  )
}
