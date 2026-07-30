"use client"

import { useDraggable, useDroppable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"

import { cn } from "@/lib/utils"
import { appointmentTypeDot } from "@/components/admin/agenda/appointment-type-badge"
import type { AppointmentListItem } from "@/modules/appointment/repository"

const START_HOUR = 7
const END_HOUR = 21
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)
const HOUR_HEIGHT = 56

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function AppointmentBlock({
  appointment,
  onOpen,
}: {
  appointment: AppointmentListItem
  onOpen: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: appointment.id,
  })

  const start = new Date(appointment.scheduledAt)
  const startMinutes = start.getHours() * 60 + start.getMinutes()
  const gridStartMinutes = START_HOUR * 60
  const top = ((startMinutes - gridStartMinutes) / 60) * HOUR_HEIGHT
  const height = Math.max((appointment.durationMinutes / 60) * HOUR_HEIGHT, 22)

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => !isDragging && onOpen(appointment.id)}
      style={{
        top,
        height,
        transform: CSS.Translate.toString(transform),
      }}
      className={cn(
        "absolute inset-x-1 z-10 cursor-grab touch-none rounded-lg border border-border/60 bg-card px-2 py-1 text-left text-[11px] shadow-sm transition-shadow select-none hover:shadow-md active:cursor-grabbing overflow-hidden",
        isDragging && "z-20 opacity-70 shadow-xl"
      )}
    >
      <div className="flex items-center gap-1">
        <span className={cn("size-1.5 shrink-0 rounded-full", appointmentTypeDot(appointment.type))} />
        <span className="truncate font-medium">
          {appointment.lead?.name ?? appointment.client?.name ?? "Compromisso"}
        </span>
      </div>
      <p className="truncate text-muted-foreground">
        {start.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {appointment.realtor.user.name}
      </p>
    </div>
  )
}

function HourCell({ date, hour }: { date: Date; hour: number }) {
  const id = `${dayKey(date)}|${hour}`
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      data-hour-cell={id}
      className={cn("border-t border-border/40 transition-colors", isOver && "bg-primary/10")}
      style={{ height: HOUR_HEIGHT }}
    />
  )
}

export function AppointmentTimeGrid({
  days,
  appointments,
  onOpenAppointment,
}: {
  days: Date[]
  appointments: AppointmentListItem[]
  onOpenAppointment: (id: string) => void
}) {
  const byDay = new Map<string, AppointmentListItem[]>()
  for (const appointment of appointments) {
    const key = dayKey(new Date(appointment.scheduledAt))
    const list = byDay.get(key) ?? []
    list.push(appointment)
    byDay.set(key, list)
  }

  const gridHeight = HOURS.length * HOUR_HEIGHT

  return (
    <div className="overflow-x-auto rounded-[20px] border border-border/60 bg-card select-none">
      <div className="flex min-w-fit">
        <div className="w-14 shrink-0">
          <div className="h-10 border-b border-border/60" />
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="flex items-start justify-end border-t border-border/40 pr-2 text-[11px] text-muted-foreground"
              style={{ height: HOUR_HEIGHT }}
            >
              {String(hour).padStart(2, "0")}h
            </div>
          ))}
        </div>

        {days.map((day) => (
          <div key={dayKey(day)} className="min-w-[140px] flex-1 border-l border-border/60">
            <div className="border-b border-border/60 px-2 py-2 text-center text-xs font-medium">
              {day.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" })}
            </div>
            <div className="relative" style={{ height: gridHeight }}>
              {HOURS.map((hour) => (
                <HourCell key={hour} date={day} hour={hour} />
              ))}
              {(byDay.get(dayKey(day)) ?? []).map((appointment) => (
                <AppointmentBlock key={appointment.id} appointment={appointment} onOpen={onOpenAppointment} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
