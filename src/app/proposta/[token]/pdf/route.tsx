import { NextResponse } from "next/server"

import { findProposalByShareToken } from "@/modules/proposal/repository"
import { renderProposalPdf } from "@/modules/proposal/pdf-render"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const proposal = await findProposalByShareToken(token)
  if (!proposal) {
    return NextResponse.json({ error: "Proposta não encontrada." }, { status: 404 })
  }

  const buffer = await renderProposalPdf(proposal)

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="proposta-${proposal.property.code}.pdf"`,
    },
  })
}
