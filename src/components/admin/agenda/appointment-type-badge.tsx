import { Home, Phone, RotateCcw, CalendarClock, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { AppointmentType } from "@/generated/prisma/client"

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  VISIT: "Visita",
  CALL: "Ligação",
  RETURN: "Retorno",
  OTHER: "Outro",
}

const META: Record<AppointmentType, { icon: LucideIcon; className: string; dot: string }> = {
  VISIT: { icon: Home, className: "bg-primary/10 text-primary", dot: "bg-primary" },
  CALL: { icon: Phone, className: "bg-blue-500/10 text-blue-500", dot: "bg-blue-500" },
  RETURN: { icon: RotateCcw, className: "bg-amber-500/10 text-amber-500", dot: "bg-amber-500" },
  OTHER: { icon: CalendarClock, className: "bg-secondary text-muted-foreground", dot: "bg-muted-foreground" },
}

export const APPOINTMENT_TYPE_OPTIONS = (Object.keys(APPOINTMENT_TYPE_LABELS) as AppointmentType[]).map(
  (value) => ({ value, label: APPOINTMENT_TYPE_LABELS[value] })
)

export function appointmentTypeDot(type: AppointmentType) {
  return META[type].dot
}

export function AppointmentTypeBadge({ type }: { type: AppointmentType }) {
  const { icon: Icon, className } = META[type]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        className
      )}
    >
      <Icon className="size-3" />
      {APPOINTMENT_TYPE_LABELS[type]}
    </span>
  )
}
