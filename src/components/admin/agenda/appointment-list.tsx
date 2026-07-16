import { AppointmentStatusBadge } from "@/components/admin/agenda/appointment-status-badge"
import { AppointmentRowActions } from "@/components/admin/agenda/appointment-row-actions"
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
}: {
  appointments: AppointmentListItem[]
}) {
  const groups = groupByDay(appointments)

  return (
    <div className="space-y-8">
      {[...groups.entries()].map(([day, items]) => (
        <div key={day} className="space-y-3">
          <p className="text-sm font-medium capitalize">{day}</p>
          <div className="space-y-2">
            {items.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-card p-4"
              >
                <div className="flex items-center gap-4">
                  <p className="w-14 shrink-0 text-sm font-medium tabular-nums">
                    {new Date(appointment.scheduledAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                      {appointment.lead?.name ?? appointment.client?.name ?? "Compromisso"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {appointment.realtor.user.name}
                      {appointment.property ? ` · ${appointment.property.title}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AppointmentStatusBadge status={appointment.status} />
                  <AppointmentRowActions
                    appointmentId={appointment.id}
                    status={appointment.status}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
