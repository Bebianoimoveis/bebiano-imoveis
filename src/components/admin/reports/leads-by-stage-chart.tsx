"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Filter } from "lucide-react"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { EmptyState } from "@/components/shared/empty-state"
import { LEAD_STAGE_LABELS, LEAD_STAGE_ORDER } from "@/components/admin/leads/lead-stage"
import type { LeadStage } from "@/generated/prisma/client"

const config: ChartConfig = {
  count: { label: "Leads", color: "var(--color-chart-2)" },
}

export function LeadsByStageChart({
  data,
}: {
  data: { stage: LeadStage; count: number }[]
}) {
  const hasData = data.some((item) => item.count > 0)

  if (!hasData) {
    return (
      <EmptyState
        icon={Filter}
        title="Nenhum lead registrado"
        description="A distribuição por etapa do funil aparece aqui assim que houver leads."
      />
    )
  }

  const countByStage = new Map(data.map((item) => [item.stage, item.count]))
  const chartData = LEAD_STAGE_ORDER.map((stage) => ({
    stage,
    label: LEAD_STAGE_LABELS[stage],
    count: countByStage.get(stage) ?? 0,
  }))

  return (
    <div className="h-72 w-full">
      <ChartContainer config={config}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 8 }}>
          <CartesianGrid horizontal={false} strokeOpacity={0.1} />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            tickLine={false}
            axisLine={false}
            width={110}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <ChartTooltip
            cursor={{ fill: "var(--secondary)" }}
            content={<ChartTooltipContent valueFormatter={(v) => `${v} lead${Number(v) === 1 ? "" : "s"}`} />}
          />
          <Bar dataKey="count" name="count" fill="var(--color-count)" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
