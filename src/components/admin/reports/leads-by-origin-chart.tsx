"use client"

import { Cell, Pie, PieChart } from "recharts"
import { PieChart as PieChartIcon } from "lucide-react"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { EmptyState } from "@/components/shared/empty-state"
import { LEAD_ORIGIN_OPTIONS } from "@/components/admin/leads/lead-origin-badge"

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
]

// Mesmo rótulo usado no badge de origem do lead (LEAD_ORIGIN_OPTIONS) —
// evita a página de relatórios ter sua própria lista desalinhada, que
// deixava origins como "instagram"/"facebook"/"google" aparecerem cru.
const ORIGIN_LABELS = Object.fromEntries(
  LEAD_ORIGIN_OPTIONS.map((option) => [option.value, option.label])
)

function originLabel(origin: string) {
  return ORIGIN_LABELS[origin.toLowerCase()] ?? origin
}

export function LeadsByOriginChart({
  data,
}: {
  data: { origin: string; count: number }[]
}) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={PieChartIcon}
        title="Nenhum lead registrado"
        description="A distribuição de leads por canal de origem aparece aqui."
      />
    )
  }

  const total = data.reduce((sum, item) => sum + item.count, 0)
  const config: ChartConfig = Object.fromEntries(
    data.map((item, index) => [item.origin, { label: originLabel(item.origin), color: COLORS[index % COLORS.length] }])
  )

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative size-40 shrink-0">
        <ChartContainer config={config}>
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent valueFormatter={(v) => `${v} lead${Number(v) === 1 ? "" : "s"}`} />} />
            <Pie
              data={data}
              dataKey="count"
              nameKey="origin"
              innerRadius="65%"
              outerRadius="100%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((item, index) => (
                <Cell key={item.origin} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-heading text-lg font-semibold">{total}</p>
          <p className="text-[11px] text-muted-foreground">leads</p>
        </div>
      </div>

      <div className="w-full flex-1 space-y-2.5">
        {data.map((item, index) => (
          <div key={item.origin} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
            <span className="flex-1 truncate text-muted-foreground">{originLabel(item.origin)}</span>
            <span className="font-medium text-foreground">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
