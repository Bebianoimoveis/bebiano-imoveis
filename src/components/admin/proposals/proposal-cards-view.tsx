"use client"

import NextImage from "next/image"
import { ImageOff } from "lucide-react"

import { ProposalStatusBadge } from "@/components/admin/proposals/proposal-status-badge"
import { ClientAvatar } from "@/components/admin/clients/client-avatar"
import { formatCurrency, formatRelativeTime } from "@/lib/format"
import type { ProposalListItem } from "@/modules/proposal/repository"

export function ProposalCardsView({
  proposals,
  onOpenProposal,
}: {
  proposals: ProposalListItem[]
  onOpenProposal: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {proposals.map((proposal) => {
        const cover = proposal.property.images[0]?.url ?? null
        return (
          <button
            key={proposal.id}
            type="button"
            onClick={() => onOpenProposal(proposal.id)}
            className="group flex flex-col gap-3 rounded-[20px] border border-border/60 bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
          >
            <div className="flex gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-secondary">
                {cover ? (
                  <NextImage src={cover} alt={proposal.property.title} fill className="object-cover" sizes="64px" />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <ImageOff className="size-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{proposal.property.title}</p>
                <p className="truncate text-xs text-muted-foreground">{proposal.property.code}</p>
                <p className="text-sm font-semibold text-primary">{formatCurrency(proposal.value.toString())}</p>
              </div>
              <ProposalStatusBadge status={proposal.status} />
            </div>

            <div className="flex items-center gap-2 border-t border-border/60 pt-3">
              <ClientAvatar name={proposal.client.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{proposal.client.name}</p>
                <p className="truncate text-xs text-muted-foreground">{proposal.realtor.user.name}</p>
              </div>
              <span className="text-xs text-muted-foreground">{formatRelativeTime(proposal.updatedAt)}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
