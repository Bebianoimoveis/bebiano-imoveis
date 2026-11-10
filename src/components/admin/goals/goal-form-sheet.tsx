"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Sheet } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/components/ui/currency-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { saveGoal, type GoalView } from "@/modules/goal/actions"
import {
  METRIC_HINTS,
  METRIC_LABELS,
  MONTH_NAMES,
  PERIOD_LABELS,
  periodLabel,
  resolveGoalPeriod,
  type GoalMetricType,
  type GoalPeriodType,
  type GoalScopeType,
} from "@/modules/goal/period"
import { cn } from "@/lib/utils"

type RealtorOption = { id: string; user: { name: string } }
type CityOption = { id: string; name: string; state: string }

const PERIOD_ORDER: GoalPeriodType[] = ["MONTH", "MONTHLY", "QUARTER", "YEAR_TO_MONTH", "YEAR", "CUSTOM"]
const PERIOD_HINTS: Record<GoalPeriodType, string> = {
  MONTH: "Vale só para o mês escolhido.",
  MONTHLY: "A mesma meta repete todo mês — cada mês é acompanhado separado.",
  QUARTER: "Soma dos três meses do trimestre.",
  YEAR_TO_MONTH: "Soma de janeiro até o mês escolhido.",
  YEAR: "Soma do ano inteiro.",
  CUSTOM: "Você escolhe a data de início e de fim.",
}
const METRIC_ORDER: GoalMetricType[] = ["SALES_VALUE", "REVENUE", "SALES_COUNT"]

type FormState = {
  title: string
  scope: GoalScopeType
  realtorId: string
  cityId: string
  metric: GoalMetricType
  period: GoalPeriodType
  year: number
  month: number
  endMonth: number
  quarter: number
  startDate: string
  endDate: string
  targetAmount: number | undefined
}

function initialState(goal: GoalView | null | undefined, defaults?: Partial<FormState>): FormState {
  const now = new Date()
  if (goal) {
    return {
      title: goal.title ?? "",
      scope: goal.scope,
      realtorId: goal.realtorId ?? "",
      cityId: goal.cityId ?? "",
      metric: goal.metric,
      period: goal.period,
      year: goal.year,
      month: goal.month,
      endMonth: goal.endMonth,
      quarter: goal.quarter,
      startDate: goal.startDate,
      endDate: goal.endDate,
      targetAmount: goal.targetAmount,
    }
  }
  return {
    title: "",
    scope: "COMPANY",
    realtorId: "",
    cityId: "",
    metric: "SALES_VALUE",
    period: "MONTH",
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    endMonth: 12,
    quarter: Math.floor(now.getMonth() / 3) + 1,
    startDate: "",
    endDate: "",
    targetAmount: undefined,
    ...defaults,
  }
}

function ChoiceButton({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3 py-2 text-left text-sm transition-colors",
        active ? "border-primary bg-primary/10 font-medium text-foreground" : "border-border/60 text-muted-foreground hover:border-primary/50",
        className
      )}
    >
      {children}
    </button>
  )
}

function MonthSelect({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {MONTH_NAMES.map((name, index) => (
          <SelectItem key={name} value={String(index + 1)}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function GoalFormSheet({
  open,
  onOpenChange,
  goal,
  defaults,
  realtors,
  cities,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal?: GoalView | null
  defaults?: Partial<FormState>
  realtors: RealtorOption[]
  cities: CityOption[]
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState<FormState>(() => initialState(goal, defaults))

  // Reinicia o formulário sempre que abre (ou troca a meta sendo editada).
  const formKey = open ? (goal?.id ?? "new") : null
  const [lastKey, setLastKey] = useState<string | null>(formKey)
  if (formKey !== lastKey) {
    setLastKey(formKey)
    if (formKey) setForm(initialState(goal, defaults))
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const preview = useMemo(() => {
    if (form.period === "CUSTOM" && (!form.startDate || !form.endDate)) return null
    const range = resolveGoalPeriod({
      period: form.period,
      year: form.year,
      month: form.month,
      endMonth: form.endMonth,
      quarter: form.quarter,
      startDate: form.startDate ? new Date(`${form.startDate}T00:00:00Z`) : undefined,
      endDate: form.endDate ? new Date(`${form.endDate}T00:00:00Z`) : undefined,
    })
    const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { timeZone: "UTC" })
    return {
      label: periodLabel({ period: form.period, ...range }),
      range: `${fmt(range.startDate)} a ${fmt(range.endDate)}`,
    }
  }, [form])

  const years = useMemo(() => {
    const current = new Date().getFullYear()
    return [current - 1, current, current + 1, current + 2]
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const result = await saveGoal({
        id: goal?.id,
        title: form.title,
        scope: form.scope,
        realtorId: form.scope === "REALTOR" ? form.realtorId || undefined : undefined,
        cityId: form.scope === "CITY" ? form.cityId || undefined : undefined,
        metric: form.metric,
        period: form.period,
        year: form.year,
        month: form.month,
        endMonth: form.period === "MONTHLY" ? form.endMonth : undefined,
        quarter: form.quarter,
        startDate: form.period === "CUSTOM" ? form.startDate : undefined,
        endDate: form.period === "CUSTOM" ? form.endDate : undefined,
        targetAmount: form.targetAmount ?? "",
      })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(goal ? "Meta atualizada." : "Meta criada.")
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar meta.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const needsMonth = form.period === "MONTH" || form.period === "YEAR_TO_MONTH" || form.period === "MONTHLY"

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      side="right"
      title={goal ? "Editar meta" : "Nova meta"}
      className="w-full max-w-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex-1 space-y-5 p-5">
          <div className="space-y-2">
            <Label>Para quem é a meta</Label>
            <div className="grid grid-cols-3 gap-2">
              <ChoiceButton active={form.scope === "COMPANY"} onClick={() => set("scope", "COMPANY")} className="text-center">
                Empresa
              </ChoiceButton>
              <ChoiceButton active={form.scope === "REALTOR"} onClick={() => set("scope", "REALTOR")} className="text-center">
                Corretor
              </ChoiceButton>
              <ChoiceButton active={form.scope === "CITY"} onClick={() => set("scope", "CITY")} className="text-center">
                Cidade
              </ChoiceButton>
            </div>
            {form.scope === "REALTOR" ? (
              <Select value={form.realtorId} onValueChange={(v) => set("realtorId", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Escolha o corretor..." />
                </SelectTrigger>
                <SelectContent>
                  {realtors.map((realtor) => (
                    <SelectItem key={realtor.id} value={realtor.id}>
                      {realtor.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            {form.scope === "CITY" ? (
              <Select value={form.cityId} onValueChange={(v) => set("cityId", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Escolha a cidade..." />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name} - {city.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>O que vai ser medido</Label>
            <div className="grid gap-2">
              {METRIC_ORDER.map((metric) => (
                <ChoiceButton key={metric} active={form.metric === metric} onClick={() => set("metric", metric)}>
                  <span className="block">{METRIC_LABELS[metric]}</span>
                  <span className="block text-xs font-normal text-muted-foreground">{METRIC_HINTS[metric]}</span>
                </ChoiceButton>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Período</Label>
            <div className="grid grid-cols-2 gap-2">
              {PERIOD_ORDER.map((period) => (
                <ChoiceButton key={period} active={form.period === period} onClick={() => set("period", period)}>
                  {PERIOD_LABELS[period]}
                </ChoiceButton>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{PERIOD_HINTS[form.period]}</p>

            {form.period === "CUSTOM" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">De</Label>
                  <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Até</Label>
                  <Input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Ano</Label>
                  <Select value={String(form.year)} onValueChange={(v) => set("year", Number(v))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(years.includes(form.year) ? years : [form.year, ...years]).map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {form.period === "QUARTER" ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Trimestre</Label>
                    <Select value={String(form.quarter)} onValueChange={(v) => set("quarter", Number(v))}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1º (jan–mar)</SelectItem>
                        <SelectItem value="2">2º (abr–jun)</SelectItem>
                        <SelectItem value="3">3º (jul–set)</SelectItem>
                        <SelectItem value="4">4º (out–dez)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                {needsMonth ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      {form.period === "YEAR_TO_MONTH" ? "Até o mês" : form.period === "MONTHLY" ? "A partir de" : "Mês"}
                    </Label>
                    <MonthSelect value={form.month} onChange={(v) => set("month", v)} />
                  </div>
                ) : null}
                {form.period === "MONTHLY" ? (
                  <div className="col-start-2 space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Até</Label>
                    <MonthSelect value={form.endMonth} onChange={(v) => set("endMonth", v)} />
                  </div>
                ) : null}
              </div>
            )}

            {preview ? (
              <p className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{preview.label}</span> · {preview.range}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>
              {form.metric === "SALES_COUNT" ? "Quantidade de vendas" : "Valor da meta"}
              {form.period === "MONTHLY" ? " por mês" : ""}
            </Label>
            {form.metric === "SALES_COUNT" ? (
              <Input
                type="number"
                min={1}
                step={1}
                value={form.targetAmount ?? ""}
                onChange={(e) => set("targetAmount", e.target.value === "" ? undefined : Number(e.target.value))}
              />
            ) : (
              <CurrencyInput value={form.targetAmount} onChange={(v) => set("targetAmount", v)} />
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Nome da meta (opcional)</Label>
            <Input
              value={form.title}
              maxLength={80}
              placeholder="Ex: Meta de fim de ano"
              onChange={(e) => set("title", e.target.value)}
            />
          </div>
        </div>

        <div className="border-t border-border/60 p-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : goal ? "Salvar alterações" : "Criar meta"}
          </Button>
        </div>
      </form>
    </Sheet>
  )
}
