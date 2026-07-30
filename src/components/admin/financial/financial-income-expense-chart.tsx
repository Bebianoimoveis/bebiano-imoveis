"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { EmptyState } from "@/components/shared/empty-state"
import { formatCurrency } from "@/lib/format"
import { BarChart3 } from "lucide-react"

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

function monthLabel(key: string) {
  const [, month] = key.split("-")
  return MONTH_LABELS[Number(month) - 1] ?? key
}

const config: ChartConfig = {
  income: { label: "Receita", color: "var(--color-chart-1)" },
  expense: { label: "Despesa", color: "var(--color-chart-4)" },
}

export function FinancialIncomeExpenseChart({
  data,
}: {
  data: { month: string; income: number; expense: number }[]
}) {
  const hasData = data.some((item) => item.income > 0 || item.expense > 0)

  if (!hasData) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Sem movimentação ainda"
        description="Receitas e despesas por mês aparecem aqui assim que houver lançamentos."
      />
    )
  }

  const chartData = data.map((item) => ({ ...item, label: monthLabel(item.month) }))

  return (
    <div className="h-64 w-full">
      <ChartContainer config={config}>
        <BarChart data={chartData}>
          <CartesianGrid vertical={false} strokeOpacity={0.1} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <YAxis hide />
          <ChartTooltip
            cursor={{ fill: "var(--secondary)" }}
            content={<ChartTooltipContent valueFormatter={(v) => formatCurrency(String(v))} />}
          />
          <Bar dataKey="income" name="income" fill="var(--color-income)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="expense" name="expense" fill="var(--color-expense)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
