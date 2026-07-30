"use client"

import { Cell, Pie, PieChart } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { EmptyState } from "@/components/shared/empty-state"
import { formatCurrency } from "@/lib/format"
import { MapPin } from "lucide-react"

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
]

export function FinancialIncomeByCityChart({
  data,
}: {
  data: { city: string; total: number }[]
}) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="Nenhuma receita vinculada a imóvel"
        description="Vincule um imóvel aos lançamentos de receita para ver a distribuição por cidade."
      />
    )
  }

  const config: ChartConfig = Object.fromEntries(
    data.map((item, index) => [item.city, { label: item.city, color: COLORS[index % COLORS.length] }])
  )

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative size-40 shrink-0">
        <ChartContainer config={config}>
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent valueFormatter={(v) => formatCurrency(String(v))} />} />
            <Pie
              data={data}
              dataKey="total"
              nameKey="city"
              innerRadius="65%"
              outerRadius="100%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((item, index) => (
                <Cell key={item.city} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </div>
      <div className="w-full flex-1 space-y-2.5">
        {data.slice(0, 6).map((item, index) => (
          <div key={item.city} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
            <span className="flex-1 truncate text-muted-foreground">{item.city}</span>
            <span className="font-medium text-foreground">{formatCurrency(item.total)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
