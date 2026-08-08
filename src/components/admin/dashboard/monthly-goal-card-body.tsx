"use client"

import { useState } from "react"
import { Plus, Target } from "lucide-react"

import { Button } from "@/components/ui/button"
import { GoalFormSheet } from "@/components/admin/financial/goal-form-sheet"
import { formatCurrency } from "@/lib/format"

type RealtorOption = { id: string; user: { name: string } }
type CityOption = { id: string; name: string; state: string }
type Goal = { id: string; targetAmount: number; realized: number; month: number | null } | null

export function MonthlyGoalCardBody({
  goal,
  year,
  realtors,
  cities,
}: {
  goal: Goal
  year: number
  realtors: RealtorOption[]
  cities: CityOption[]
}) {
  const [open, setOpen] = useState(false)

  const percent = goal && goal.targetAmount > 0 ? Math.min(100, Math.round((goal.realized / goal.targetAmount) * 100)) : 0
  const hit = goal ? goal.realized >= goal.targetAmount : false

  return (
    <div className="rounded-[20px] border border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-base font-semibold">Meta do mês</h2>
        <span className="flex size-8 items-center justify-center rounded-lg bg-gold/15 text-gold">
          <Target className="size-4" />
        </span>
      </div>

      {!goal ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma meta cadastrada para o mês.</p>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
            <Plus className="size-3.5" /> Cadastrar meta
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={hit ? "h-full rounded-full bg-emerald-500" : "h-full rounded-full bg-primary"}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(goal.realized)}</span>
            <span>{formatCurrency(goal.targetAmount)}</span>
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            {percent}% da meta {goal.month ? "do mês" : "anual"} atingido
          </p>
        </div>
      )}

      <GoalFormSheet open={open} onOpenChange={setOpen} defaultYear={year} realtors={realtors} cities={cities} />
    </div>
  )
}
