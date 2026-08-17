"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Target, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { GoalFormSheet } from "@/components/admin/financial/goal-form-sheet"
import { deleteGoal } from "@/modules/goal/actions"
import { formatCurrency } from "@/lib/format"

type RealtorOption = { id: string; user: { name: string } }
type CityOption = { id: string; name: string; state: string }

type Goal = {
  id: string
  scope: "COMPANY" | "REALTOR" | "CITY"
  metric: "REVENUE" | "SALES_COUNT"
  year: number
  month: number | null
  targetAmount: number
  realtorName: string | null
  cityName: string | null
  realized: number
}

function formatGoalValue(goal: Goal, value: number) {
  return goal.metric === "SALES_COUNT" ? `${value} venda${value === 1 ? "" : "s"}` : formatCurrency(value)
}

const SCOPE_LABELS: Record<Goal["scope"], string> = {
  COMPANY: "Empresa",
  REALTOR: "Corretor",
  CITY: "Cidade",
}

function goalTitle(goal: Goal) {
  const period = goal.month ? `${String(goal.month).padStart(2, "0")}/${goal.year}` : `Ano ${goal.year}`
  const target = goal.realtorName ?? goal.cityName ?? "Empresa"
  return `${target} — ${period}`
}

export function GoalsPanel({
  goals,
  year,
  realtors,
  cities,
}: {
  goals: Goal[]
  year: number
  realtors: RealtorOption[]
  cities: CityOption[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteGoal(id)
        toast.success("Meta excluída.")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao excluir.")
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Metas de {year}</p>
        <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Nova meta
        </Button>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Nenhuma meta definida"
          description="Crie metas de empresa, corretor ou cidade e acompanhe o realizado em tempo real."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => {
            const percent = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.realized / goal.targetAmount) * 100)) : 0
            const hit = goal.realized >= goal.targetAmount
            return (
              <div key={goal.id} className="space-y-3 rounded-[20px] border border-border/60 bg-card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{SCOPE_LABELS[goal.scope]}</p>
                    <p className="font-heading text-sm font-semibold">{goalTitle(goal)}</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        disabled={isPending}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir esta meta?</AlertDialogTitle>
                        <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel />
                        <AlertDialogAction onClick={() => handleDelete(goal.id)}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="space-y-1.5">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={hit ? "h-full rounded-full bg-emerald-500" : "h-full rounded-full bg-primary"}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatGoalValue(goal, goal.realized)}</span>
                    <span>{formatGoalValue(goal, goal.targetAmount)}</span>
                  </div>
                </div>
                <p className="text-xs font-medium text-muted-foreground">{percent}% da meta atingido</p>
              </div>
            )
          })}
        </div>
      )}

      <GoalFormSheet open={open} onOpenChange={setOpen} defaultYear={year} realtors={realtors} cities={cities} />
    </div>
  )
}
