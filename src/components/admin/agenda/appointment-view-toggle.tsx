import Link from "next/link"
import { CalendarDays, Columns3, LayoutGrid, List, Rows3 } from "lucide-react"

import { cn } from "@/lib/utils"

export type AppointmentView = "list" | "kanban" | "month" | "week" | "day"

const VIEWS: { value: AppointmentView; label: string; icon: typeof List }[] = [
  { value: "list", label: "Lista", icon: List },
  { value: "kanban", label: "Kanban", icon: Columns3 },
  { value: "month", label: "Mês", icon: LayoutGrid },
  { value: "week", label: "Semana", icon: Rows3 },
  { value: "day", label: "Dia", icon: CalendarDays },
]

export function AppointmentViewToggle({
  view,
  buildHref,
}: {
  view: AppointmentView
  buildHref: (view: AppointmentView) => string
}) {
  return (
    <div className="flex items-center rounded-xl border border-border/60 bg-secondary/30 p-1">
      {VIEWS.map((option) => (
        <Link
          key={option.value}
          href={buildHref(option.value)}
          aria-label={option.label}
          title={option.label}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors",
            view === option.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <option.icon className="size-3.5" />
          <span className="hidden sm:inline">{option.label}</span>
        </Link>
      ))}
    </div>
  )
}
