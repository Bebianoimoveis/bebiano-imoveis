"use client"

import { motion } from "motion/react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"

import { cn } from "@/lib/utils"

function growth(value: number, previousValue: number): number | null {
  if (previousValue === 0) return value > 0 ? 100 : null
  return Math.round(((value - previousValue) / previousValue) * 100)
}

// Mesma convenção de tons já usada em badges do admin (lead-temperature,
// status financeiro) — utilitários Tailwind diretos, sem token novo no
// tema. "gold" é o único tom "de marca"; os demais são só pra dar
// identidade visual/diferenciação entre os cards do grid.
const TONE_CLASSES = {
  primary: "bg-primary/15 text-primary",
  gold: "bg-gold/15 text-gold",
  emerald: "bg-emerald-500/15 text-emerald-400",
  blue: "bg-blue-500/15 text-blue-400",
  violet: "bg-violet-500/15 text-violet-400",
  amber: "bg-amber-500/15 text-amber-400",
  rose: "bg-rose-500/15 text-rose-400",
  cyan: "bg-cyan-500/15 text-cyan-400",
} as const

export type StatCardTone = keyof typeof TONE_CLASSES

export function StatCard({
  icon,
  label,
  value,
  description,
  previousValue,
  currentValue,
  tone = "primary",
}: {
  icon: React.ReactNode
  label: string
  value: string
  description: string
  /** Se informados junto com `currentValue`, mostra o indicador de crescimento. */
  previousValue?: number
  currentValue?: number
  tone?: StatCardTone
}) {
  const delta =
    previousValue !== undefined && currentValue !== undefined
      ? growth(currentValue, previousValue)
      : null

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="group rounded-[20px] border border-border/60 bg-card p-5 shadow-sm transition-shadow hover:shadow-lg hover:shadow-black/20"
    >
      <div className="flex items-start justify-between">
        <span className={cn("flex size-10 items-center justify-center rounded-xl", TONE_CLASSES[tone])}>
          {icon}
        </span>
        {delta !== null ? (
          <span
            className={cn(
              "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
              delta >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-destructive/15 text-destructive"
            )}
          >
            {delta >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(delta)}%
          </span>
        ) : null}
      </div>
      <p className="mt-4 truncate text-sm text-muted-foreground">{label}</p>
      <p className="truncate font-heading text-2xl font-semibold text-foreground" title={value}>
        {value}
      </p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
    </motion.div>
  )
}
