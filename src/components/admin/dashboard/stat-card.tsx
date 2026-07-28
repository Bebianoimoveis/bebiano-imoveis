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
      className="group rounded-[20px] border border-border/60 bg-card p-5 shadow-sm transition-shadow hover:shadow-lg hover:shadow-black/20"
    >
      <div className="flex items-start justify-between">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
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
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <p className="font-heading text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
    </motion.div>
  )
}
