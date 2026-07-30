import { Flame, Snowflake, Sun } from "lucide-react"

import type { LeadTemperature } from "@/generated/prisma/client"

const TEMPERATURE_META: Record<LeadTemperature, { label: string; icon: typeof Flame; className: string }> = {
  HOT: { label: "Quente", icon: Flame, className: "bg-red-500/10 text-red-500" },
  WARM: { label: "Morno", icon: Sun, className: "bg-amber-500/10 text-amber-500" },
  COLD: { label: "Frio", icon: Snowflake, className: "bg-blue-500/10 text-blue-500" },
}

export function LeadTemperatureBadge({ temperature }: { temperature: LeadTemperature }) {
  const meta = TEMPERATURE_META[temperature]
  const Icon = meta.icon

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.className}`}
    >
      <Icon className="size-3" />
      {meta.label}
    </span>
  )
}

export const LEAD_TEMPERATURE_OPTIONS: { value: LeadTemperature; label: string }[] = [
  { value: "HOT", label: "Quente" },
  { value: "WARM", label: "Morno" },
  { value: "COLD", label: "Frio" },
]
