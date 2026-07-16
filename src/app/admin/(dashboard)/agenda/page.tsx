import { CalendarDays, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { AppointmentFormDialog } from "@/components/admin/agenda/appointment-form-dialog"
import { AppointmentList } from "@/components/admin/agenda/appointment-list"
import { listAdminAppointments } from "@/modules/appointment/actions"
import { listRealtors } from "@/modules/realtor/actions"

export default async function AdminAgendaPage() {
  const [appointments, realtors] = await Promise.all([
    listAdminAppointments({ from: new Date() }),
    listRealtors(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Agenda
          </h1>
          <p className="text-sm text-muted-foreground">
            Próximas visitas e compromissos.
          </p>
        </div>
        <AppointmentFormDialog
          realtors={realtors}
          trigger={
            <Button>
              <Plus className="size-4" />
              Novo compromisso
            </Button>
          }
        />
      </div>

      {appointments.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nenhum compromisso agendado"
          description="Visitas e compromissos futuros aparecem aqui."
        />
      ) : (
        <AppointmentList appointments={appointments} />
      )}
    </div>
  )
}
