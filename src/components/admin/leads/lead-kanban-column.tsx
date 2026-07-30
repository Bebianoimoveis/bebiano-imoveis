"use client"

import { useDroppable } from "@dnd-kit/core"
import { UserPlus } from "lucide-react"

import { LeadCard } from "@/components/admin/leads/lead-card"
import { LEAD_STAGE_COLORS, LEAD_STAGE_LABELS } from "@/components/admin/leads/lead-stage"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { LeadListItem } from "@/modules/lead/repository"
import type { LeadStage } from "@/generated/prisma/client"

export function LeadKanbanColumn({
  stage,
  leads,
  onOpenLead,
  onAddLead,
}: {
  stage: LeadStage
  leads: LeadListItem[]
  onOpenLead: (leadId: string) => void
  onAddLead: (stage: LeadStage) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const colors = LEAD_STAGE_COLORS[stage]
  const totalValue = leads.reduce((sum, lead) => sum + (lead.property ? Number(lead.property.price) : 0), 0)

  return (
    <div className="flex w-80 shrink-0 flex-col rounded-[20px] border border-border/60 bg-card/40">
      <div className={cn("flex items-center justify-between rounded-t-[20px] px-4 py-3", colors.bg)}>
        <div className="flex items-center gap-2">
          <span className={cn("size-2.5 rounded-full", colors.dot)} />
          <p className="text-sm font-semibold text-foreground">{LEAD_STAGE_LABELS[stage]}</p>
          <span className={cn("rounded-full px-1.5 py-0.5 text-[11px] font-semibold", colors.bg, colors.text)}>
            {leads.length}
          </span>
        </div>
      </div>
      {totalValue > 0 ? (
        <p className="px-4 pt-2 text-xs text-muted-foreground">
          {formatCurrency(totalValue.toString())} em jogo
        </p>
      ) : null}

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2.5 overflow-y-auto p-3 transition-colors",
          isOver && "bg-primary/5 ring-2 ring-inset ring-primary/40"
        )}
        style={{ minHeight: 120, maxHeight: "calc(100vh - 26rem)" }}
      >
        {leads.length === 0 ? (
          <button
            type="button"
            onClick={() => onAddLead(stage)}
            className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border py-8 text-center text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <UserPlus className="size-5" />
            <span className="text-xs">Adicionar Lead</span>
          </button>
        ) : (
          leads.map((lead) => <LeadCard key={lead.id} lead={lead} onOpen={onOpenLead} />)
        )}
      </div>
    </div>
  )
}
