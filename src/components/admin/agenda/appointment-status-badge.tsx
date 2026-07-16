import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AppointmentStatus } from "@/generated/prisma/client"

const LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  DONE: "Realizado",
  CANCELED: "Cancelado",
  NO_SHOW: "Não compareceu",
}

const STYLES: Record<AppointmentStatus, string> = {
  SCHEDULED: "bg-muted text-muted-foreground",
  CONFIRMED: "bg-primary/10 text-primary",
  DONE: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  CANCELED: "bg-destructive/10 text-destructive",
  NO_SHOW: "bg-destructive/10 text-destructive",
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", STYLES[status])}>
      {LABELS[status]}
    </Badge>
  )
}
