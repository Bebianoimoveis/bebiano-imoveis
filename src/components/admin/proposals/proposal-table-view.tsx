"use client"

import NextImage from "next/image"
import { ImageOff } from "lucide-react"

import { ProposalStatusBadge } from "@/components/admin/proposals/proposal-status-badge"
import { ProposalRowActions } from "@/components/admin/proposals/proposal-row-actions"
import { ClientAvatar } from "@/components/admin/clients/client-avatar"
import { formatCurrency, formatRelativeTime } from "@/lib/format"
import type { ProposalListItem } from "@/modules/proposal/repository"

function coverUrl(proposal: ProposalListItem) {
  return proposal.property.images[0]?.url ?? null
}

export function ProposalTableView({
  proposals,
  onOpenProposal,
}: {
  proposals: ProposalListItem[]
  onOpenProposal: (id: string) => void
}) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-border/60 bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left text-xs font-medium text-muted-foreground uppercase">
            <th className="px-4 py-3">Código</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Imóvel</th>
            <th className="px-4 py-3">Corretor</th>
            <th className="px-4 py-3">Valor original</th>
            <th className="px-4 py-3">Ofertado</th>
            <th className="px-4 py-3">Desconto</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Validade</th>
            <th className="px-4 py-3">Atualizada</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {proposals.map((proposal) => {
            const cover = coverUrl(proposal)
            const discount = proposal.originalValue
              ? Number(proposal.originalValue) - Number(proposal.value)
              : null
            return (
              <tr
                key={proposal.id}
                onClick={() => onOpenProposal(proposal.id)}
                className="cursor-pointer border-b border-border/40 transition-colors last:border-0 hover:bg-secondary/20"
              >
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {proposal.id.slice(0, 8).toUpperCase()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ClientAvatar name={proposal.client.name} size="sm" />
                    <span className="truncate font-medium">{proposal.client.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-secondary">
                      {cover ? (
                        <NextImage src={cover} alt={proposal.property.title} fill className="object-cover" sizes="36px" />
                      ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground">
                          <ImageOff className="size-3.5" />
                        </div>
                      )}
                    </div>
                    <span className="max-w-40 truncate">{proposal.property.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{proposal.realtor.user.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {proposal.originalValue ? formatCurrency(proposal.originalValue.toString()) : "—"}
                </td>
                <td className="px-4 py-3 font-medium">{formatCurrency(proposal.value.toString())}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {discount && discount > 0 ? formatCurrency(discount) : "—"}
                </td>
                <td className="px-4 py-3">
                  <ProposalStatusBadge status={proposal.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString("pt-BR") : "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatRelativeTime(proposal.updatedAt)}</td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <ProposalRowActions proposal={proposal} onOpen={() => onOpenProposal(proposal.id)} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
