import { Sparkles } from "lucide-react"

import { formatCurrency } from "@/lib/format"

// Projeção simples de média móvel dos últimos 3 meses — rotulada
// explicitamente como estimativa, não uma previsão garantida (ver plano).
export function FinancialProjectionCard({
  data,
}: {
  data: { month: string; income: number; expense: number }[]
}) {
  const lastThree = data.slice(-3)
  const avg = (key: "income" | "expense") =>
    lastThree.length > 0 ? lastThree.reduce((sum, item) => sum + item[key], 0) / lastThree.length : 0

  const projectedIncome = avg("income")
  const projectedExpense = avg("expense")
  const projectedBalance = projectedIncome - projectedExpense

  return (
    <div className="rounded-[20px] border border-border/60 bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Sparkles className="size-4" />
        </span>
        <div>
          <p className="text-sm font-medium">Projeção para o próximo mês</p>
          <p className="text-xs text-muted-foreground">Estimativa baseada na média dos últimos 3 meses — não é uma previsão garantida.</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Receita estimada</p>
          <p className="font-heading text-lg font-semibold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(projectedIncome)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Despesa estimada</p>
          <p className="font-heading text-lg font-semibold text-destructive">{formatCurrency(projectedExpense)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Saldo estimado</p>
          <p className="font-heading text-lg font-semibold">{formatCurrency(projectedBalance)}</p>
        </div>
      </div>
    </div>
  )
}
