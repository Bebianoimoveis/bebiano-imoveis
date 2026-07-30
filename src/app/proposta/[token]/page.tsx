import type { Metadata } from "next"
import NextImage from "next/image"
import { notFound } from "next/navigation"
import { Check, Download, ImageOff, MapPin } from "lucide-react"

import { findProposalByShareToken, markProposalViewed } from "@/modules/proposal/repository"
import { PROPOSAL_STATUS_LABELS } from "@/components/admin/proposals/proposal-status-badge"
import { formatCurrency, getDisplayAddress } from "@/lib/format"
import { siteConfig } from "@/config/site"

export const metadata: Metadata = {
  title: "Sua proposta",
  robots: { index: false, follow: false },
}

export default async function PublicProposalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const proposal = await findProposalByShareToken(token)
  if (!proposal) notFound()

  // Marca a primeira visualização de verdade — só aqui, nunca no admin.
  // Idempotente: não sobrescreve viewedAt se já existir.
  if (!proposal.viewedAt) {
    await markProposalViewed(proposal.id, proposal.status, false)
  }

  const cover = proposal.property.images.find((image) => image.isCover)?.url ?? proposal.property.images[0]?.url
  const gallery = proposal.property.images.slice(0, 5)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <p className="font-heading text-lg font-semibold text-primary">{siteConfig.name}</p>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            {PROPOSAL_STATUS_LABELS[proposal.status]}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-5 py-8">
        <div>
          <p className="text-sm text-muted-foreground">Proposta preparada para</p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{proposal.client.name}</h1>
        </div>

        <div className="overflow-hidden rounded-[20px] border border-border/60 bg-card">
          <div className="relative h-64 w-full bg-secondary sm:h-80">
            {cover ? (
              <NextImage src={cover} alt={proposal.property.title} fill className="object-cover" sizes="768px" priority />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <ImageOff className="size-8" />
              </div>
            )}
          </div>
          {gallery.length > 1 ? (
            <div className="grid grid-cols-5 gap-1 p-1">
              {gallery.map((image) => (
                <div key={image.id} className="relative aspect-square overflow-hidden rounded-lg bg-secondary">
                  <NextImage src={image.url} alt="" fill className="object-cover" sizes="150px" />
                </div>
              ))}
            </div>
          ) : null}
          <div className="space-y-2 p-5">
            <h2 className="font-heading text-xl font-semibold">{proposal.property.title}</h2>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4" />
              {getDisplayAddress(proposal.property)}
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
              <span>{proposal.property.bedrooms} dormitórios</span>
              <span>{proposal.property.bathrooms} banheiros</span>
              <span>{proposal.property.parkingSpots} vagas</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-[20px] border border-border/60 bg-card p-5">
          <h3 className="font-heading text-lg font-semibold">Valores propostos</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {proposal.originalValue ? (
              <div>
                <p className="text-muted-foreground">Valor anunciado</p>
                <p className="font-medium">{formatCurrency(proposal.originalValue.toString())}</p>
              </div>
            ) : null}
            <div>
              <p className="text-muted-foreground">Valor proposto</p>
              <p className="text-lg font-semibold text-primary">{formatCurrency(proposal.value.toString())}</p>
            </div>
            {proposal.downPayment ? (
              <div>
                <p className="text-muted-foreground">Entrada</p>
                <p className="font-medium">{formatCurrency(proposal.downPayment.toString())}</p>
              </div>
            ) : null}
            {proposal.financingValue ? (
              <div>
                <p className="text-muted-foreground">Financiamento</p>
                <p className="font-medium">{formatCurrency(proposal.financingValue.toString())}</p>
              </div>
            ) : null}
            {proposal.fgtsValue ? (
              <div>
                <p className="text-muted-foreground">FGTS</p>
                <p className="font-medium">{formatCurrency(proposal.fgtsValue.toString())}</p>
              </div>
            ) : null}
            {proposal.installments ? (
              <div>
                <p className="text-muted-foreground">Parcelamento</p>
                <p className="font-medium">
                  {proposal.installments}x {proposal.installmentValue ? formatCurrency(proposal.installmentValue.toString()) : ""}
                </p>
              </div>
            ) : null}
          </div>
          {proposal.paymentMethod ? (
            <p className="border-t border-border/60 pt-3 text-sm">
              <span className="text-muted-foreground">Forma de pagamento: </span>
              {proposal.paymentMethod}
            </p>
          ) : null}
          {proposal.validUntil ? (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Check className="size-4" /> Válida até {new Date(proposal.validUntil).toLocaleDateString("pt-BR")}
            </p>
          ) : null}
          {proposal.notes ? <p className="text-sm text-muted-foreground">{proposal.notes}</p> : null}
        </div>

        <div className="rounded-[20px] border border-border/60 bg-card p-5 text-sm">
          <p className="text-muted-foreground">Corretor responsável</p>
          <p className="font-medium">{proposal.realtor.user.name}</p>
          {proposal.realtor.phone ? (
            <a
              href={`https://wa.me/${proposal.realtor.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-primary hover:underline"
            >
              Falar no WhatsApp
            </a>
          ) : null}
        </div>

        <a
          href={`/proposta/${proposal.shareToken}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Download className="size-4" /> Baixar proposta em PDF
        </a>

        <p className="pb-8 text-center text-xs text-muted-foreground">
          Esta é uma visualização exclusiva enviada por {siteConfig.name}. Em caso de dúvidas, fale
          diretamente com o corretor responsável.
        </p>
      </main>
    </div>
  )
}
