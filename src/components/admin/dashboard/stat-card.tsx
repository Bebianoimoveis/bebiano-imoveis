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

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="group rounded-2xl border border-border/60 bg-card p-3 shadow-sm transition-shadow hover:shadow-lg hover:shadow-black/20 sm:rounded-[20px] sm:p-5"
    >
      <div className="flex items-start justify-between">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary sm:size-10 sm:rounded-xl [&_svg]:size-4 sm:[&_svg]:size-5">
          {icon}
        </span>
        {delta !== null ? (
          <span
            className={cn(
              "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium sm:px-2 sm:text-xs",
              delta >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-destructive/15 text-destructive"
            )}
          >
            {delta >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(delta)}%
          </span>
        ) : null}
      </div>
      <p className="mt-2 truncate text-xs text-muted-foreground sm:mt-4 sm:text-sm">{label}</p>
      <p className="truncate font-heading text-lg font-semibold text-foreground sm:text-2xl" title={value}>
        {value}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-muted-foreground sm:text-xs">{description}</p>
    </motion.div>
  )
}
