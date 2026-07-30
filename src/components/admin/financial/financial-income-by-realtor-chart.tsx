"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { EmptyState } from "@/components/shared/empty-state"
import { formatCurrency } from "@/lib/format"
import { Users } from "lucide-react"

const config: ChartConfig = {
  total: { label: "Receita", color: "var(--color-chart-2)" },
}

export function FinancialIncomeByRealtorChart({
  data,
}: {
  data: { realtorId: string; name: string; total: number }[]
}) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhuma receita vinculada a corretor"
        description="Vincule um corretor aos lançamentos de receita para ver este ranking."
      />
    )
  }

  return (
    <div className="h-64 w-full">
      <ChartContainer config={config}>
        <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
          <CartesianGrid horizontal={false} strokeOpacity={0.1} />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={96}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <ChartTooltip
            cursor={{ fill: "var(--secondary)" }}
            content={<ChartTooltipContent valueFormatter={(v) => formatCurrency(String(v))} />}
          />
          <Bar dataKey="total" name="total" fill="var(--color-total)" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
