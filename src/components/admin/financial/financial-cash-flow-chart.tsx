"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { EmptyState } from "@/components/shared/empty-state"
import { formatCurrency } from "@/lib/format"
import { LineChart as LineChartIcon } from "lucide-react"

const config: ChartConfig = {
  balance: { label: "Saldo acumulado", color: "var(--color-chart-1)" },
}

export function FinancialCashFlowChart({
  data,
}: {
  data: { day: number; balance: number }[]
}) {
  const hasData = data.some((item) => item.balance !== 0)

  if (!hasData) {
    return (
      <EmptyState
        icon={LineChartIcon}
        title="Nenhum fluxo neste mês"
        description="O saldo acumulado dia a dia aparece aqui conforme houver lançamentos."
      />
    )
  }

  return (
    <div className="h-64 w-full">
      <ChartContainer config={config}>
        <LineChart data={data}>
          <CartesianGrid vertical={false} strokeOpacity={0.1} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <YAxis hide />
          <ChartTooltip
            cursor={{ stroke: "var(--secondary)" }}
            content={<ChartTooltipContent labelFormatter={(l) => `Dia ${l}`} valueFormatter={(v) => formatCurrency(String(v))} />}
          />
          <Line
            type="monotone"
            dataKey="balance"
            name="balance"
            stroke="var(--color-balance)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}
