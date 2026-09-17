"use client"

import { useEffect, useState } from "react"
import { Filter } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { LEAD_STAGE_COLORS, LEAD_STAGE_LABELS, LEAD_STAGE_ORDER } from "@/components/admin/leads/lead-stage"
import type { LeadStage } from "@/generated/prisma/client"
import { cn } from "@/lib/utils"

export function LeadsFunnelChart({
  data,
}: {
  data: { stage: LeadStage; count: number }[]
}) {
  // Anima as barras crescendo do zero só depois do primeiro paint — sem
  // isso a transição de largura não tem "de onde" partir (o valor final
  // já chegaria pronto no primeiro render).
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const total = data.reduce((sum, item) => sum + item.count, 0)
  if (total === 0) {
    return (
      <EmptyState
        icon={Filter}
        title="Nenhum lead no funil ainda"
        description="O funil aparece assim que houver leads em andamento."
      />
    )
  }

  // LOST não faz parte da progressão natural do funil (é uma saída, não
  // uma etapa a mais) — mostrado à parte, não misturado com o resto.
  const stages = LEAD_STAGE_ORDER.filter((stage) => stage !== "LOST")
  const byStage = new Map(data.map((item) => [item.stage, item.count]))
  const lost = byStage.get("LOST") ?? 0
  const activeTotal = stages.reduce((sum, stage) => sum + (byStage.get(stage) ?? 0), 0)
  const maxValue = Math.max(...stages.map((stage) => byStage.get(stage) ?? 0), 1)

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        {stages.map((stage) => {
          const value = byStage.get(stage) ?? 0
          const widthPct = value === 0 ? 0 : Math.max((value / maxValue) * 100, 8)
          const pctOfTotal = activeTotal === 0 ? 0 : Math.round((value / activeTotal) * 100)
          const colors = LEAD_STAGE_COLORS[stage]

          return (
            <div key={stage} className="flex items-center gap-3">
              <p className="w-24 shrink-0 truncate text-sm text-muted-foreground sm:w-32">
                {LEAD_STAGE_LABELS[stage]}
              </p>
              <div className="h-7 min-w-0 flex-1 overflow-hidden rounded-full bg-secondary/50">
                <div
                  className={cn("h-full rounded-full transition-all duration-700 ease-out", colors.dot)}
                  style={{ width: mounted ? `${widthPct}%` : "0%" }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">
                {value}
              </span>
              <span className="w-9 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                {value > 0 ? `${pctOfTotal}%` : ""}
              </span>
            </div>
          )
        })}
      </div>
      {lost > 0 ? (
        <p className="flex items-center gap-1.5 border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
          <span className={cn("size-1.5 rounded-full", LEAD_STAGE_COLORS.LOST.dot)} />
          {lost} {lost === 1 ? "lead perdido" : "leads perdidos"} nesse período
        </p>
      ) : null}
    </div>
  )
}
