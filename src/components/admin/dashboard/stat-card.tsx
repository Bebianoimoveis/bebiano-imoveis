"use client"

import { motion } from "motion/react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"

import { cn } from "@/lib/utils"

function growth(value: number, previousValue: number): number | null {
  if (previousValue === 0) return value > 0 ? 100 : null
  return Math.round(((value - previousValue) / previousValue) * 100)
}

export function StatCard({
  icon,
  label,
  value,
  description,
  previousValue,
  currentValue,
}: {
  icon: React.ReactNode
  label: string
  value: string
  description: string
  /** Se informados junto com `currentValue`, mostra o indicador de crescimento. */
  previousValue?: number
  currentValue?: number
}) {
  const delta =
    previousValue !== undefined && currentValue !== undefined
      ? growth(currentValue, previousValue)
      : null

  const deltaBadge =
    delta !== null ? (
      <span
        className={cn(
          "flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
          delta >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-destructive/15 text-destructive"
        )}
      >
        {delta >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
        {Math.abs(delta)}%
      </span>
    ) : null

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="group rounded-xl border border-border/60 bg-card p-2.5 shadow-sm transition-shadow hover:shadow-lg hover:shadow-black/20 sm:rounded-[20px] sm:p-5"
    >
      {/* No mobile o ícone fica ao lado do valor (uma linha só) e a
          descrição some — o card vertical de 4 linhas empilhadas era
          alto demais numa grade de 2 colunas. A partir de sm volta ao
          layout original (ícone sozinho em cima, valor grande embaixo). */}
      <div className="flex items-center gap-2.5 sm:hidden">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary [&_svg]:size-3.5">
          {icon}
        </span>
        <p className="truncate font-heading text-base font-semibold text-foreground" title={value}>
          {value}
        </p>
        {deltaBadge ? <div className="ml-auto">{deltaBadge}</div> : null}
      </div>
      <p className="mt-1 truncate text-[11px] text-muted-foreground sm:hidden">{label}</p>

      <div className="hidden sm:flex sm:items-start sm:justify-between">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary [&_svg]:size-5">
          {icon}
        </span>
        {deltaBadge}
      </div>
      <p className="hidden truncate text-sm text-muted-foreground sm:mt-4 sm:block">{label}</p>
      <p className="hidden truncate font-heading text-2xl font-semibold text-foreground sm:block" title={value}>
        {value}
      </p>
      <p className="mt-0.5 hidden truncate text-xs text-muted-foreground sm:block">{description}</p>
    </motion.div>
  )
}
