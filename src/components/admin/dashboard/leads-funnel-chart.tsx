"use client"

import { Cell, Funnel, FunnelChart, LabelList } from "recharts"

import { ChartContainer } from "@/components/ui/chart"
import { EmptyState } from "@/components/shared/empty-state"
import { LEAD_STAGE_LABELS, LEAD_STAGE_ORDER } from "@/components/admin/leads/lead-stage"
import { Filter } from "lucide-react"
import type { LeadStage } from "@/generated/prisma/client"

// Marsala em degradê — do mais escuro (topo do funil) ao mais claro
// (fundo), sem sair da paleta da marca.
const SHADES = [
  "oklch(0.62 0.16 18)",
  "oklch(0.58 0.16 18)",
  "oklch(0.54 0.16 18)",
  "oklch(0.5 0.15 18)",
  "oklch(0.46 0.14 18)",
  "oklch(0.42 0.13 18)",
  "oklch(0.38 0.12 18)",
]

export function LeadsFunnelChart({
  data,
}: {
  data: { stage: LeadStage; count: number }[]
}) {
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
  // uma etapa a mais) — mostrado à parte, não empilhado com o resto.
  const stages = LEAD_STAGE_ORDER.filter((stage) => stage !== "LOST")
  const byStage = new Map(data.map((item) => [item.stage, item.count]))
  const lost = byStage.get("LOST") ?? 0

  const chartData = stages.map((stage) => ({
    stage,
    name: LEAD_STAGE_LABELS[stage],
    value: byStage.get(stage) ?? 0,
  }))

  return (
    <div className="space-y-3">
      <div className="h-64 w-full">
        <ChartContainer config={{}}>
          <FunnelChart>
            <Funnel data={chartData} dataKey="value" nameKey="name" isAnimationActive>
              {chartData.map((entry, index) => (
                <Cell key={entry.stage} fill={SHADES[index % SHADES.length]} />
              ))}
              <LabelList
                position="right"
                dataKey="name"
                fill="var(--foreground)"
                stroke="none"
                fontSize={12}
              />
              <LabelList
                position="left"
                dataKey="value"
                fill="var(--foreground)"
                stroke="none"
                fontSize={12}
                fontWeight={600}
              />
            </Funnel>
          </FunnelChart>
        </ChartContainer>
      </div>
      {lost > 0 ? (
        <p className="text-center text-xs text-muted-foreground">
          + {lost} {lost === 1 ? "lead perdido" : "leads perdidos"} nesse período
        </p>
      ) : null}
    </div>
  )
}
