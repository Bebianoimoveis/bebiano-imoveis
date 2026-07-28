"use client"

import * as React from "react"
import { ResponsiveContainer, Tooltip } from "recharts"

import { cn } from "@/lib/utils"

export type ChartConfig = Record<
  string,
  { label: string; color: string }
>

const ChartConfigContext = React.createContext<ChartConfig | null>(null)

// Wrapper fino sobre Recharts: injeta as cores do config como CSS vars
// (--color-<key>) no próprio container, então as séries do gráfico
// referenciam `var(--color-leads)` etc. em vez de cor hardcoded — herda
// automaticamente o tema (claro/escuro) sem duplicar lógica de cor.
export function ChartContainer({
  config,
  className,
  children,
}: {
  config: ChartConfig
  className?: string
  children: React.ReactElement
}) {
  const style = Object.fromEntries(
    Object.entries(config).map(([key, value]) => [`--color-${key}`, value.color])
  ) as React.CSSProperties

  return (
    <ChartConfigContext.Provider value={config}>
      <div className={cn("h-full w-full", className)} style={style}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartConfigContext.Provider>
  )
}

export const ChartTooltip = Tooltip

export function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number | string; color?: string }>
  label?: string
  labelFormatter?: (label: string) => string
  valueFormatter?: (value: number | string) => string
}) {
  const config = React.useContext(ChartConfigContext)

  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-xl">
      {label ? (
        <p className="mb-1.5 font-medium text-popover-foreground">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      ) : null}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">
              {(entry.name && config?.[entry.name]?.label) ?? entry.name}
            </span>
            <span className="ml-auto font-medium text-popover-foreground">
              {entry.value !== undefined
                ? valueFormatter
                  ? valueFormatter(entry.value)
                  : entry.value
                : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
