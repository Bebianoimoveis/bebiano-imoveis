"use client"

import { AppointmentStatusBadge } from "@/components/admin/agenda/appointment-status-badge"
import { AppointmentTypeBadge } from "@/components/admin/agenda/appointment-type-badge"
import type { AppointmentListItem } from "@/modules/appointment/repository"

function groupByDay(appointments: AppointmentListItem[]) {
  const groups = new Map<string, AppointmentListItem[]>()

  for (const appointment of appointments) {
    const key = new Date(appointment.scheduledAt).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    })
    const existing = groups.get(key) ?? []
    existing.push(appointment)
    groups.set(key, existing)
  }

  return groups
}

export function AppointmentList({
  appointments,
  onOpenAppointment,
}: {
  appointments: AppointmentListItem[]
  onOpenAppointment: (id: string) => void
}) {
  const groups = groupByDay(appointments)

  return (
    <div className="space-y-8">
      {[...groups.entries()].map(([day, items]) => (
        <div key={day} className="space-y-3">
          <p className="text-sm font-medium capitalize text-muted-foreground">{day}</p>
          <div className="space-y-2">
            {items.map((appointment) => (
              <button
                key={appointment.id}
                type="button"
                onClick={() => onOpenAppointment(appointment.id)}
                className="group flex w-full items-center justify-between gap-4 rounded-[20px] border border-border/60 bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <p className="w-14 shrink-0 text-sm font-medium tabular-nums">
                    {new Date(appointment.scheduledAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {appointment.lead?.name ?? appointment.client?.name ?? "Compromisso"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {appointment.realtor.user.name}
                      {appointment.property ? ` · ${appointment.property.title}` : ""}
                      {" · "}
                      {appointment.durationMinutes} min
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AppointmentTypeBadge type={appointment.type} />
                  <AppointmentStatusBadge status={appointment.status} />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
