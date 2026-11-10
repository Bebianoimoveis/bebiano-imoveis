"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Plus, Target } from "lucide-react"

import { Button } from "@/components/ui/button"
import { GoalFormSheet } from "@/components/admin/goals/goal-form-sheet"
import type { GoalView } from "@/modules/goal/actions"
import { STATUS_LABELS } from "@/modules/goal/period"
import { formatCurrency } from "@/lib/format"

type RealtorOption = { id: string; user: { name: string } }
type CityOption = { id: string; name: string; state: string }

function formatGoalValue(goal: GoalView, value: number) {
  return goal.metric === "SALES_COUNT" ? `${value} venda${value === 1 ? "" : "s"}` : formatCurrency(value)
}

export function MonthlyGoalCardBody({
  goal,
  activeCount,
  onTrackCount,
  realtors,
  cities,
}: {
  goal: GoalView | null
  activeCount: number
  onTrackCount: number
  realtors: RealtorOption[]
  cities: CityOption[]
}) {
  const [open, setOpen] = useState(false)

  const percent = goal ? Math.round(goal.progress.percent) : 0
  const hit = goal ? goal.progress.status === "HIT" : false

  return (
    <div className="rounded-[20px] border border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-base font-semibold">
          {!goal || goal.period === "MONTH" || goal.period === "MONTHLY" ? "Meta do mês" : "Meta da empresa"}
        </h2>
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary admin-light:bg-[linear-gradient(145deg,#8F1238,#650923)] admin-light:text-white admin-light:shadow-sm">
          <Target className="size-4" />
        </span>
      </div>

      {!goal ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma meta da empresa valendo agora.</p>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
            <Plus className="size-3.5" /> Cadastrar meta
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {goal.period === "MONTHLY" ? goal.currentLabel : goal.periodLabel}
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={hit ? "h-full rounded-full bg-emerald-500" : "h-full rounded-full bg-primary"}
              style={{ width: `${Math.min(100, percent)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatGoalValue(goal, goal.progress.realized)}</span>
            <span>{formatGoalValue(goal, goal.progress.target)}</span>
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            {percent}% atingido · {STATUS_LABELS[goal.progress.status]}
          </p>
        </div>
      )}

      <Link
        href="/admin/metas"
        className="mt-4 flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2 text-xs font-medium transition-colors hover:bg-secondary"
      >
        <span>
          {activeCount > 0
            ? `${onTrackCount} de ${activeCount} meta${activeCount === 1 ? "" : "s"} no ritmo`
            : "Ver todas as metas"}
        </span>
        <ArrowRight className="size-3.5" />
      </Link>

      <GoalFormSheet open={open} onOpenChange={setOpen} realtors={realtors} cities={cities} />
    </div>
  )
}
