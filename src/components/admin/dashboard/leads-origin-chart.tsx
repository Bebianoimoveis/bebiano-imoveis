"use client"

import { Cell, Pie, PieChart } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { EmptyState } from "@/components/shared/empty-state"
import { PieChart as PieChartIcon } from "lucide-react"

const ORIGIN_LABELS: Record<string, string> = {
  site: "Site",
  whatsapp: "WhatsApp",
  indicacao: "Indicação",
}

const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"]

export function LeadsOriginChart({
  data,
}: {
  data: { origin: string; count: number }[]
}) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={PieChartIcon}
        title="Nenhum lead ainda"
        description="Assim que chegarem leads, a origem deles aparece aqui."
      />
    )
  }

  const total = data.reduce((sum, item) => sum + item.count, 0)
  const config: ChartConfig = Object.fromEntries(
    data.map((item, index) => [
      item.origin,
      { label: ORIGIN_LABELS[item.origin] ?? item.origin, color: COLORS[index % COLORS.length] },
    ])
  )

  return (
    <div className="flex items-center gap-6">
      <div className="relative size-40 shrink-0">
        <ChartContainer config={config}>
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
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
          <p className="font-heading text-2xl font-semibold">{total}</p>
          <p className="text-[11px] text-muted-foreground">total</p>
        </div>
      </div>

      <div className="flex-1 space-y-2.5">
        {data.map((item, index) => (
          <div key={item.origin} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="flex-1 text-muted-foreground">
              {ORIGIN_LABELS[item.origin] ?? item.origin}
            </span>
            <span className="font-medium text-foreground">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
