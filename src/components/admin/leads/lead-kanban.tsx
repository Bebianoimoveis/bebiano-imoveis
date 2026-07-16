import { LeadCard } from "@/components/admin/leads/lead-card"
import {
  LEAD_STAGE_LABELS,
  LEAD_STAGE_ORDER,
} from "@/components/admin/leads/lead-stage"
import type { LeadListItem } from "@/modules/lead/repository"

export function LeadKanban({ leads }: { leads: LeadListItem[] }) {
  const leadsByStage = LEAD_STAGE_ORDER.map((stage) => ({
    stage,
    leads: leads.filter((lead) => lead.stage === stage),
  }))

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {leadsByStage.map(({ stage, leads: stageLeads }) => (
        <div key={stage} className="w-72 shrink-0 space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-medium">{LEAD_STAGE_LABELS[stage]}</p>
            <span className="text-xs text-muted-foreground">
              {stageLeads.length}
            </span>
          </div>
          <div className="space-y-2 rounded-xl bg-secondary/30 p-2 min-h-24">
            {stageLeads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
