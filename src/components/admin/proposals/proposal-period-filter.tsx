"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { CalendarRange, X } from "lucide-react"

import { Input } from "@/components/ui/input"
import { brazilDateOnly } from "@/lib/date"
import { cn } from "@/lib/utils"

const iso = (date: Date) => date.toISOString().slice(0, 10)

// Atalhos de período (por data de criação da proposta). Calculados em
// Brasília e como "YYYY-MM-DD", o mesmo formato dos campos "Criada de/até"
// do painel Filtros — os dois controlam os mesmos parâmetros da URL.
function buildPresets() {
  const today = brazilDateOnly()
  const y = today.getUTCFullYear()
  const m = today.getUTCMonth()
  const day = (year: number, month: number, d: number) => iso(new Date(Date.UTC(year, month, d)))
  return [
    { label: "Este mês", from: day(y, m, 1), to: day(y, m + 1, 0) },
    { label: "Mês passado", from: day(y, m - 1, 1), to: day(y, m, 0) },
    { label: "Últimos 30 dias", from: day(y, m, today.getUTCDate() - 29), to: iso(today) },
    { label: "Este ano", from: day(y, 0, 1), to: day(y, 11, 31) },
  ]
}

export function ProposalPeriodFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const from = searchParams.get("createdFrom") ?? ""
  const to = searchParams.get("createdTo") ?? ""
  const presets = buildPresets()
  const hasPeriod = Boolean(from || to)

  function setPeriod(nextFrom: string, nextTo: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (nextFrom) params.set("createdFrom", nextFrom)
    else params.delete("createdFrom")
    if (nextTo) params.set("createdTo", nextTo)
    else params.delete("createdTo")
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border/60 bg-card px-3.5 py-2.5">
      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
        <CalendarRange className="size-4 text-muted-foreground admin-light:text-primary" />
        Período
        <span className="hidden text-xs font-normal text-muted-foreground sm:inline">(data de criação da proposta)</span>
      </span>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setPeriod("", "")}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            !hasPeriod
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
          )}
        >
          Tudo
        </button>
        {presets.map((preset) => {
          const active = from === preset.from && to === preset.to
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => setPeriod(preset.from, preset.to)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              {preset.label}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          De
          <Input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setPeriod(e.target.value, to)}
            className="h-8 w-[9.5rem] text-xs"
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Até
          <Input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setPeriod(from, e.target.value)}
            className="h-8 w-[9.5rem] text-xs"
          />
        </label>
        {hasPeriod ? (
          <button
            type="button"
            onClick={() => setPeriod("", "")}
            aria-label="Limpar período"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
