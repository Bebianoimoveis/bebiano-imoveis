import { Building2 } from "lucide-react"

import { LeadAvatar } from "@/components/admin/leads/lead-avatar"
import { LeadOriginBadge } from "@/components/admin/leads/lead-origin-badge"
import { LeadStageBadge } from "@/components/admin/leads/lead-stage-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { formatCurrency } from "@/lib/format"
import type { LeadListItem } from "@/modules/lead/repository"

// Nunca mostrar Kanban no celular — mesma decisão do Portfólio de
// Imóveis: no mobile a experiência vira lista/cards, sem arrastar nada.
export function LeadMobileList({
  leads,
  onOpenLead,
}: {
  leads: LeadListItem[]
  onOpenLead: (leadId: string) => void
}) {
  if (leads.length === 0) {
    return <EmptyState icon={Building2} title="Nenhum lead encontrado" />
  }

  return (
    <div className="space-y-2.5">
      {leads.map((lead) => (
        <button
          key={lead.id}
          type="button"
          onClick={() => onOpenLead(lead.id)}
          className="flex w-full items-start gap-3 rounded-[16px] border border-border/60 bg-card p-3.5 text-left shadow-sm"
        >
          <LeadAvatar name={lead.name} size="sm" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium">{lead.name}</p>
              <LeadStageBadge stage={lead.stage} />
            </div>
            <p className="text-xs text-muted-foreground">{lead.phone}</p>
            {lead.property ? (
              <p className="truncate text-xs text-muted-foreground">
                {lead.property.title} · {formatCurrency(lead.property.price.toString())}
              </p>
            ) : null}
            <LeadOriginBadge origin={lead.origin} />
          </div>
        </button>
      ))}
    </div>
  )
}
