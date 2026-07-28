"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { EmptyState } from "@/components/shared/empty-state"
import { formatCurrency } from "@/lib/format"
import { TrendingUp } from "lucide-react"

const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
]

function monthLabel(key: string) {
  const [, month] = key.split("-")
  return MONTH_LABELS[Number(month) - 1] ?? key
}

const config: ChartConfig = {
  total: { label: "Vendas", color: "var(--color-chart-1)" },
}

export function SalesChart({
  data,
}: {
  data: { month: string; total: number; count: number }[]
}) {
  const hasSales = data.some((item) => item.total > 0)

  if (!hasSales) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Nenhuma venda registrada ainda"
        description="Contratos ativos ou concluídos aparecem aqui por mês."
      />
    )
  }

  const chartData = data.map((item) => ({ ...item, label: monthLabel(item.month) }))

  return (
    <div className="h-56 w-full">
      <ChartContainer config={config}>
        <BarChart data={chartData}>
          <CartesianGrid vertical={false} strokeOpacity={0.1} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <YAxis hide />
          <ChartTooltip
            cursor={{ fill: "var(--secondary)" }}
            content={<ChartTooltipContent valueFormatter={(v) => formatCurrency(String(v))} />}
          />
          <Bar dataKey="total" name="total" fill="var(--color-total)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
