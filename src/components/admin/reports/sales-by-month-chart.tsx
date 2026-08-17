"use client"

import { Bar, ComposedChart, CartesianGrid, Line, XAxis, YAxis } from "recharts"
import { TrendingUp } from "lucide-react"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { EmptyState } from "@/components/shared/empty-state"
import { formatCurrency } from "@/lib/format"

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

function monthLabel(key: string) {
  const [, month] = key.split("-")
  return MONTH_LABELS[Number(month) - 1] ?? key
}

const config: ChartConfig = {
  total: { label: "Valor vendido", color: "var(--color-chart-1)" },
  count: { label: "Contratos", color: "var(--color-chart-3)" },
}

export function SalesByMonthChart({
  data,
}: {
  data: { month: string; total: number; count: number }[]
}) {
  const hasData = data.some((item) => item.total > 0 || item.count > 0)

  if (!hasData) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Nenhuma venda no período"
        description="O histórico de vendas por mês aparece aqui assim que houver contratos ativos ou concluídos."
      />
    )
  }

  const chartData = data.map((item) => ({ ...item, label: monthLabel(item.month) }))

  return (
    <div className="h-64 w-full">
      <ChartContainer config={config}>
        <ComposedChart data={chartData}>
          <CartesianGrid vertical={false} strokeOpacity={0.1} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <YAxis yAxisId="value" hide />
          <YAxis yAxisId="count" orientation="right" hide />
          <ChartTooltip
            cursor={{ fill: "var(--secondary)" }}
            content={
              <ChartTooltipContent
                valueFormatter={(value, entry) =>
                  entry?.name === "count"
                    ? `${value} contrato${Number(value) === 1 ? "" : "s"}`
                    : formatCurrency(String(value))
                }
              />
            }
          />
          <Bar yAxisId="value" dataKey="total" name="total" fill="var(--color-total)" radius={[6, 6, 0, 0]} />
          <Line
            yAxisId="count"
            dataKey="count"
            name="count"
            stroke="var(--color-count)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-count)" }}
          />
        </ComposedChart>
      </ChartContainer>
    </div>
  )
}
