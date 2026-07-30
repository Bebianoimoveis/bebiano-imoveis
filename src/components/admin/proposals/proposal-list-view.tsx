"use client"

import { ProposalStatusBadge } from "@/components/admin/proposals/proposal-status-badge"
import { ClientAvatar } from "@/components/admin/clients/client-avatar"
import { formatCurrency, formatRelativeTime } from "@/lib/format"
import type { ProposalListItem } from "@/modules/proposal/repository"

export function ProposalListView({
  proposals,
  onOpenProposal,
}: {
  proposals: ProposalListItem[]
  onOpenProposal: (id: string) => void
}) {
  return (
    <div className="space-y-2">
      {proposals.map((proposal) => (
        <button
          key={proposal.id}
          type="button"
          onClick={() => onOpenProposal(proposal.id)}
          className="flex w-full items-center gap-3 rounded-[20px] border border-border/60 bg-card p-3 text-left"
        >
          <ClientAvatar name={proposal.client.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{proposal.client.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {proposal.property.title} · {formatCurrency(proposal.value.toString())}
            </p>
            <p className="text-[11px] text-muted-foreground">{formatRelativeTime(proposal.updatedAt)}</p>
          </div>
          <ProposalStatusBadge status={proposal.status} />
        </button>
      ))}
    </div>
  )
}
