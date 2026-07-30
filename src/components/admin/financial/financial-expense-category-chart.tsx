"use client"

import { Cell, Pie, PieChart } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { EmptyState } from "@/components/shared/empty-state"
import { formatCurrency } from "@/lib/format"
import { PieChart as PieChartIcon } from "lucide-react"

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
]

export function FinancialExpenseCategoryChart({
  data,
}: {
  data: { category: string; total: number }[]
}) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={PieChartIcon}
        title="Nenhuma despesa registrada"
        description="A distribuição de despesas por categoria aparece aqui."
      />
    )
  }

  const total = data.reduce((sum, item) => sum + item.total, 0)
  const config: ChartConfig = Object.fromEntries(
    data.map((item, index) => [item.category, { label: item.category, color: COLORS[index % COLORS.length] }])
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
              nameKey="category"
              innerRadius="65%"
              outerRadius="100%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((item, index) => (
                <Cell key={item.category} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-heading text-xs font-semibold">{formatCurrency(total)}</p>
          <p className="text-[11px] text-muted-foreground">total</p>
        </div>
      </div>

      <div className="w-full flex-1 space-y-2.5">
        {data.map((item, index) => (
          <div key={item.category} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
            <span className="flex-1 truncate text-muted-foreground">{item.category}</span>
            <span className="font-medium text-foreground">{formatCurrency(item.total)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
