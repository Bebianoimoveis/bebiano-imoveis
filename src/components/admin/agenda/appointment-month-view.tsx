"use client"

import { cn } from "@/lib/utils"
import { appointmentTypeDot } from "@/components/admin/agenda/appointment-type-badge"
import type { AppointmentListItem } from "@/modules/appointment/repository"

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function buildMonthGrid(anchor: Date) {
  const year = anchor.getFullYear()
  const month = anchor.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const start = new Date(firstOfMonth)
  start.setDate(start.getDate() - start.getDay())

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    return date
  })
}

export function AppointmentMonthView({
  anchor,
  appointments,
  onOpenAppointment,
  onOpenDay,
}: {
  anchor: Date
  appointments: AppointmentListItem[]
  onOpenAppointment: (id: string) => void
  onOpenDay: (date: Date) => void
}) {
  const days = buildMonthGrid(anchor)
  const currentMonth = anchor.getMonth()
  const today = dayKey(new Date())

  const byDay = new Map<string, AppointmentListItem[]>()
  for (const appointment of appointments) {
    const key = dayKey(new Date(appointment.scheduledAt))
    const list = byDay.get(key) ?? []
    list.push(appointment)
    byDay.set(key, list)
  }

  return (
    <div className="overflow-hidden rounded-[20px] border border-border/60 bg-card">
      <div className="grid grid-cols-7 border-b border-border/60">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = dayKey(day)
          const items = byDay.get(key) ?? []
          const isCurrentMonth = day.getMonth() === currentMonth
          const isToday = key === today
          const visible = items.slice(0, 3)
          const overflow = items.length - visible.length

          return (
            <button
              key={key}
              type="button"
              onClick={() => onOpenDay(day)}
              className={cn(
                "min-h-24 space-y-1 border-t border-l border-border/60 p-1.5 text-left transition-colors first:border-l-0 hover:bg-secondary/20",
                !isCurrentMonth && "bg-secondary/10 text-muted-foreground/50"
              )}
            >
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-full text-xs",
                  isToday && "bg-primary text-primary-foreground font-semibold"
                )}
              >
                {day.getDate()}
              </span>
              <div className="space-y-0.5">
                {visible.map((appointment) => (
                  <div
                    key={appointment.id}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenAppointment(appointment.id)
                    }}
                    className="flex items-center gap-1 truncate rounded-md bg-secondary/50 px-1.5 py-0.5 text-[10px] hover:bg-secondary"
                  >
                    <span className={cn("size-1.5 shrink-0 rounded-full", appointmentTypeDot(appointment.type))} />
                    <span className="truncate">
                      {new Date(appointment.scheduledAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      {appointment.lead?.name ?? appointment.client?.name ?? "Compromisso"}
                    </span>
                  </div>
                ))}
                {overflow > 0 ? (
                  <p className="px-1.5 text-[10px] text-muted-foreground">+{overflow} mais</p>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
