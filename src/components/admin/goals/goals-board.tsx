"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Building2,
  CalendarRange,
  CheckCircle2,
  Clock,
  MapPin,
  Pencil,
  Plus,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { GoalFormSheet } from "@/components/admin/goals/goal-form-sheet"
import { deleteGoal, type GoalView } from "@/modules/goal/actions"
import { METRIC_LABELS, STATUS_LABELS, type GoalStatus } from "@/modules/goal/period"
import { cn } from "@/lib/utils"

type RealtorOption = { id: string; user: { name: string } }
type CityOption = { id: string; name: string; state: string }

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 })

function formatValue(goal: GoalView, value: number) {
  if (goal.metric === "SALES_COUNT") {
    const rounded = Math.round(value * 10) / 10
    return `${rounded.toLocaleString("pt-BR")} venda${rounded === 1 ? "" : "s"}`
  }
  return currency.format(value)
}

function formatShort(goal: GoalView, value: number) {
  if (goal.metric === "SALES_COUNT") return (Math.round(value * 10) / 10).toLocaleString("pt-BR")
  return `R$ ${compact.format(value)}`
}

const STATUS_STYLES: Record<GoalStatus, string> = {
  HIT: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 admin-light:text-emerald-700",
  ON_TRACK: "bg-sky-500/15 text-sky-700 dark:text-sky-400 admin-light:text-sky-700",
  ATTENTION: "bg-amber-500/15 text-amber-700 dark:text-amber-400 admin-light:text-amber-700",
  BEHIND: "bg-red-500/15 text-red-700 dark:text-red-400 admin-light:text-red-700",
  MISSED: "bg-red-500/10 text-red-700/80 dark:text-red-400/80 admin-light:text-red-700/80",
  UPCOMING: "bg-secondary text-muted-foreground",
}

const BAR_STYLES: Record<GoalStatus, string> = {
  HIT: "bg-emerald-500",
  ON_TRACK: "bg-sky-500",
  ATTENTION: "bg-amber-500",
  BEHIND: "bg-red-500",
  MISSED: "bg-red-400",
  UPCOMING: "bg-muted-foreground/40",
}

function StatusBadge({ status }: { status: GoalStatus }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </span>
  )
}

function statusSentence(goal: GoalView) {
  const p = goal.progress
  switch (p.status) {
    case "HIT":
      return `Meta batida! ${Math.round(p.percent)}% do objetivo.`
    case "UPCOMING":
      return "O período desta meta ainda não começou."
    case "MISSED":
      return `Período encerrado com ${Math.round(p.percent)}% da meta. Faltaram ${formatValue(goal, p.remaining)}.`
    default: {
      const ahead = p.realized - p.expectedNow
      const base =
        ahead >= 0
          ? `Está ${formatValue(goal, ahead)} acima do esperado para hoje.`
          : `Está ${formatValue(goal, -ahead)} abaixo do esperado para hoje.`
      return `${base} Faltam ${formatValue(goal, p.remaining)} em ${p.daysLeft} dia${p.daysLeft === 1 ? "" : "s"}.`
    }
  }
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

function GoalOwner({ goal }: { goal: GoalView }) {
  if (goal.scope === "REALTOR") {
    return (
      <div className="flex min-w-0 items-center gap-2.5">
        <Avatar className="size-9">
          {goal.realtorPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={goal.realtorPhotoUrl} alt="" className="size-full object-cover object-top" />
          ) : (
            <AvatarFallback>{initials(goal.realtorName ?? "?")}</AvatarFallback>
          )}
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-heading text-sm font-semibold">{goal.realtorName}</p>
          <p className="truncate text-xs text-muted-foreground">{goal.title ?? "Meta do corretor"}</p>
        </div>
      </div>
    )
  }
  const Icon = goal.scope === "CITY" ? MapPin : Building2
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate font-heading text-sm font-semibold">
          {goal.scope === "CITY" ? goal.cityName : "Bebiano Imóveis"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {goal.title ?? (goal.scope === "CITY" ? "Meta da cidade" : "Meta da empresa")}
        </p>
      </div>
    </div>
  )
}

function MonthBars({ goal }: { goal: GoalView }) {
  const max = Math.max(...goal.breakdown.map((m) => Math.max(m.realized, m.target)), 1)
  return (
    <div className="space-y-2">
      <div className="flex h-20 items-end gap-1">
        {goal.breakdown.map((month) => {
          const height = Math.max(4, (month.realized / max) * 100)
          const targetLine = (month.target / max) * 100
          const color =
            month.status === "HIT"
              ? "bg-emerald-500"
              : month.status === "MISSED"
                ? "bg-red-400/80"
                : month.status === "CURRENT"
                  ? "bg-sky-500"
                  : "bg-muted-foreground/20"
          return (
            <div
              key={month.fullLabel}
              className="group relative flex h-full flex-1 flex-col justify-end"
              title={`${month.fullLabel}: ${formatValue(goal, month.realized)} de ${formatValue(goal, month.target)}`}
            >
              <div
                className="pointer-events-none absolute inset-x-0 border-t border-dashed border-foreground/40"
                style={{ bottom: `${targetLine}%` }}
              />
              <div
                className={cn("w-full rounded-t-[4px] transition-all", color, month.realized === 0 && "opacity-40")}
                style={{ height: `${month.realized === 0 ? 4 : height}%` }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-1">
        {goal.breakdown.map((month) => (
          <span key={month.fullLabel} className="flex-1 text-center text-[10px] text-muted-foreground">
            {month.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function GoalCard({
  goal,
  canManage,
  onEdit,
  onDelete,
  isPending,
}: {
  goal: GoalView
  canManage: boolean
  onEdit: (goal: GoalView) => void
  onDelete: (id: string) => void
  isPending: boolean
}) {
  const p = goal.progress
  const barPercent = Math.min(100, p.percent)
  const showPace = p.status !== "UPCOMING" && p.status !== "HIT" && p.daysLeft > 0

  return (
    <div className="flex flex-col gap-4 rounded-[20px] border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <GoalOwner goal={goal} />
        <div className="flex shrink-0 items-center gap-1">
          {canManage ? (
            <>
              <button
                type="button"
                aria-label="Editar meta"
                onClick={() => onEdit(goal)}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Pencil className="size-3.5" />
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    aria-label="Excluir meta"
                    disabled={isPending}
                    className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir esta meta?</AlertDialogTitle>
                    <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel />
                    <AlertDialogAction onClick={() => onDelete(goal.id)}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 font-medium">
          <CalendarRange className="size-3" /> {goal.periodLabel}
        </span>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 font-medium">{METRIC_LABELS[goal.metric]}</span>
        <StatusBadge status={p.status} />
      </div>

      <div className="space-y-2">
        {goal.period === "MONTHLY" ? (
          <p className="text-xs font-medium text-muted-foreground">{goal.currentLabel}</p>
        ) : null}
        <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
          <p className="font-heading text-2xl font-semibold tracking-tight">{formatValue(goal, p.realized)}</p>
          <p className="text-sm text-muted-foreground">
            de <span className="font-medium text-foreground">{formatValue(goal, p.target)}</span>
          </p>
        </div>

        <div className="relative pt-1">
          <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn("h-full rounded-full transition-all duration-700", BAR_STYLES[p.status])}
              style={{ width: `${barPercent}%` }}
            />
          </div>
          {showPace ? (
            <div
              className="absolute top-0 h-5 w-0.5 rounded-full bg-foreground/70"
              style={{ left: `calc(${Math.min(100, p.expectedPercent)}% - 1px)` }}
              title={`Esperado até hoje: ${formatValue(goal, p.expectedNow)}`}
            />
          ) : null}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{Math.round(p.percent)}% da meta</span>
          {showPace ? <span>Marca = onde deveria estar hoje</span> : null}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{statusSentence(goal)}</p>

      {p.status !== "UPCOMING" ? (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-secondary/60 p-2.5">
            <p className="text-[11px] text-muted-foreground">Falta</p>
            <p className="text-sm font-semibold">{formatShort(goal, p.remaining)}</p>
          </div>
          <div className="rounded-xl bg-secondary/60 p-2.5">
            <p className="text-[11px] text-muted-foreground">{p.daysLeft > 0 ? "Dias restantes" : "Encerrada"}</p>
            <p className="text-sm font-semibold">{p.daysLeft > 0 ? p.daysLeft : "—"}</p>
          </div>
          <div className="rounded-xl bg-secondary/60 p-2.5">
            <p className="text-[11px] text-muted-foreground">Projeção</p>
            <p
              className={cn(
                "flex items-center gap-1 text-sm font-semibold",
                p.projection !== null && p.projection >= p.target ? "text-emerald-600 dark:text-emerald-400" : ""
              )}
            >
              {p.projection === null ? "—" : formatShort(goal, p.projection)}
              {p.projection !== null && p.daysLeft > 0 ? (
                p.projection >= p.target ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5 text-red-500" />
              ) : null}
            </p>
          </div>
        </div>
      ) : null}

      {goal.breakdown.length > 1 ? (
        <div className="space-y-2 border-t border-border/60 pt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{goal.period === "MONTHLY" ? "Mês a mês" : "Mês a mês (linha = ritmo ideal)"}</span>
            {goal.period === "MONTHLY" && goal.monthsClosed > 0 ? (
              <span className="font-medium text-foreground">
                Bateu em {goal.monthsHit} de {goal.monthsClosed} {goal.monthsClosed === 1 ? "mês" : "meses"}
              </span>
            ) : null}
          </div>
          <MonthBars goal={goal} />
        </div>
      ) : null}
    </div>
  )
}

type Filter = "ALL" | "COMPANY" | "REALTOR" | "CITY"

export function GoalsBoard({
  goals,
  year,
  realtors,
  cities,
  canManage,
  personal = false,
}: {
  goals: GoalView[]
  year: number
  realtors: RealtorOption[]
  cities: CityOption[]
  canManage: boolean
  // Visão do próprio corretor: só as metas dele, sem filtros/ranking.
  personal?: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<GoalView | null>(null)
  const [filter, setFilter] = useState<Filter>("ALL")

  function openCreate() {
    setEditing(null)
    setSheetOpen(true)
  }

  function openEdit(goal: GoalView) {
    setEditing(goal)
    setSheetOpen(true)
  }

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

  const counts = useMemo(() => {
    const active = goals.filter((g) => g.progress.status !== "UPCOMING")
    return {
      total: goals.length,
      hit: goals.filter((g) => g.progress.status === "HIT").length,
      onTrack: goals.filter((g) => g.progress.status === "ON_TRACK").length,
      attention: active.filter((g) => ["ATTENTION", "BEHIND", "MISSED"].includes(g.progress.status)).length,
    }
  }, [goals])

  const companyGoals = goals.filter((g) => g.scope === "COMPANY")
  const cityGoals = goals.filter((g) => g.scope === "CITY")
  const realtorGroups = useMemo(() => {
    const map = new Map<string, GoalView[]>()
    for (const goal of goals.filter((g) => g.scope === "REALTOR")) {
      const key = goal.realtorId ?? "?"
      map.set(key, [...(map.get(key) ?? []), goal])
    }
    return [...map.values()].sort((a, b) => (a[0].realtorName ?? "").localeCompare(b[0].realtorName ?? ""))
  }, [goals])

  // Ranking: a meta "da vez" de cada corretor (a que está valendo, mais
  // curta primeiro), ordenada pelo % atingido.
  const ranking = useMemo(() => {
    const rank = (g: GoalView) => (g.period === "MONTH" || g.period === "MONTHLY" ? 0 : g.period === "QUARTER" ? 1 : 2)
    return realtorGroups
      .map((group) => {
        const live = group.filter((g) => g.progress.status !== "UPCOMING")
        const pick = [...(live.length ? live : group)].sort((a, b) => rank(a) - rank(b))[0]
        return pick
      })
      .sort((a, b) => b.progress.percent - a.progress.percent)
  }, [realtorGroups])

  const show = (scope: Filter) => filter === "ALL" || filter === scope

  const filters: { value: Filter; label: string; count: number }[] = [
    { value: "ALL", label: "Todas", count: goals.length },
    { value: "COMPANY", label: "Empresa", count: companyGoals.length },
    { value: "REALTOR", label: "Corretores", count: goals.length - companyGoals.length - cityGoals.length },
    ...(cityGoals.length > 0 ? [{ value: "CITY" as Filter, label: "Cidades", count: cityGoals.length }] : []),
  ]

  const grid = "grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3"

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: `Metas em ${year}`, value: counts.total, icon: Target, tone: "text-primary bg-primary/15" },
          { label: "Batidas", value: counts.hit, icon: Trophy, tone: "text-emerald-600 bg-emerald-500/15 dark:text-emerald-400" },
          { label: "No ritmo", value: counts.onTrack, icon: CheckCircle2, tone: "text-sky-600 bg-sky-500/15 dark:text-sky-400" },
          { label: "Precisam de atenção", value: counts.attention, icon: Clock, tone: "text-amber-600 bg-amber-500/15 dark:text-amber-400" },
        ].map((kpi) => (
          <div key={kpi.label} className="flex items-center gap-3 rounded-[20px] border border-border/60 bg-card p-4 shadow-sm">
            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", kpi.tone)}>
              <kpi.icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-heading text-2xl font-semibold leading-none">{kpi.value}</p>
              <p className="mt-1 text-xs leading-tight text-muted-foreground">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {personal ? (
        goals.length === 0 ? (
          <EmptyState
            icon={Target}
            title={`Nenhuma meta definida para você em ${year}`}
            description="Quando a Bebiano definir uma meta para você, ela aparece aqui com o seu progresso."
          />
        ) : (
          <div className={grid}>
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                canManage={false}
                onEdit={openEdit}
                onDelete={handleDelete}
                isPending={isPending}
              />
            ))}
          </div>
        )
      ) : (
      <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                filter === item.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label} <span className="opacity-70">({item.count})</span>
            </button>
          ))}
        </div>
        {canManage ? (
          <Button className="gap-1.5" onClick={openCreate}>
            <Plus className="size-4" /> Nova meta
          </Button>
        ) : null}
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title={`Nenhuma meta em ${year}`}
          description="Crie metas da empresa (do mês, do trimestre, do ano, acumuladas) e metas individuais para cada corretor."
          action={
            canManage ? (
              <Button size="sm" className="gap-1.5" onClick={openCreate}>
                <Plus className="size-4" /> Criar primeira meta
              </Button>
            ) : null
          }
        />
      ) : null}

      {show("COMPANY") && companyGoals.length > 0 ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
            <Building2 className="size-4 text-primary" /> Metas da empresa
          </h2>
          <div className={grid}>
            {companyGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                canManage={canManage}
                onEdit={openEdit}
                onDelete={handleDelete}
                isPending={isPending}
              />
            ))}
          </div>
        </section>
      ) : null}

      {show("REALTOR") && realtorGroups.length > 0 ? (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
            <Trophy className="size-4 text-primary" /> Metas dos corretores
          </h2>

          {ranking.length > 1 ? (
            <div className="rounded-[20px] border border-border/60 bg-card p-5 shadow-sm">
              <p className="mb-3 text-sm font-medium">Quem está mais perto da meta</p>
              <div className="space-y-3">
                {ranking.map((goal, index) => (
                  <div key={goal.id} className="flex items-center gap-3">
                    <span className="w-5 shrink-0 text-center text-sm font-semibold text-muted-foreground">{index + 1}º</span>
                    <span className="w-28 shrink-0 truncate text-sm font-medium sm:w-40">{goal.realtorName}</span>
                    <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div
                        className={cn("h-full rounded-full", BAR_STYLES[goal.progress.status])}
                        style={{ width: `${Math.min(100, goal.progress.percent)}%` }}
                      />
                    </div>
                    <span className="w-12 shrink-0 text-right text-sm font-semibold">{Math.round(goal.progress.percent)}%</span>
                    <span className="hidden w-32 shrink-0 text-right text-xs text-muted-foreground md:block">
                      {goal.period === "MONTHLY" ? goal.currentLabel : goal.periodLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className={grid}>
            {realtorGroups.flat().map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                canManage={canManage}
                onEdit={openEdit}
                onDelete={handleDelete}
                isPending={isPending}
              />
            ))}
          </div>
        </section>
      ) : null}

      {show("CITY") && cityGoals.length > 0 ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
            <MapPin className="size-4 text-primary" /> Metas por cidade
          </h2>
          <div className={grid}>
            {cityGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                canManage={canManage}
                onEdit={openEdit}
                onDelete={handleDelete}
                isPending={isPending}
              />
            ))}
          </div>
        </section>
      ) : null}

      {filter !== "ALL" && goals.length > 0 && filters.find((f) => f.value === filter)?.count === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma meta nesse grupo em {year}.</p>
      ) : null}
      </>
      )}

      {canManage ? (
      <GoalFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        goal={editing}
        defaults={{ year }}
        realtors={realtors}
        cities={cities}
      />
      ) : null}
    </div>
  )
}
