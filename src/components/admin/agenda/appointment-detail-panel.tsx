"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Pencil, Phone, Trash2 } from "lucide-react"

import { Sheet } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon"
import { AppointmentStatusBadge } from "@/components/admin/agenda/appointment-status-badge"
import { AppointmentTypeBadge } from "@/components/admin/agenda/appointment-type-badge"
import { AppointmentFormSheet } from "@/components/admin/agenda/appointment-form-sheet"
import { updateAppointmentStatus, deleteAppointment } from "@/modules/appointment/actions"
import type { AppointmentListItem } from "@/modules/appointment/repository"
import type { AppointmentStatus } from "@/generated/prisma/client"

const STATUS_OPTIONS: AppointmentStatus[] = ["SCHEDULED", "CONFIRMED", "DONE", "CANCELED", "NO_SHOW"]
const STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  DONE: "Realizado",
  CANCELED: "Cancelado",
  NO_SHOW: "Não compareceu",
}

type RealtorOption = { id: string; user: { name: string } }

export function AppointmentDetailPanel({
  appointment,
  onClose,
  realtors,
}: {
  appointment: AppointmentListItem | null
  onClose: () => void
  realtors: RealtorOption[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)

  function handleStatusChange(status: AppointmentStatus) {
    if (!appointment) return
    startTransition(async () => {
      try {
        await updateAppointmentStatus(appointment.id, status)
        toast.success("Status atualizado.")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao atualizar.")
      }
    })
  }

  function handleDelete() {
    if (!appointment) return
    startTransition(async () => {
      try {
        await deleteAppointment(appointment.id)
        toast.success("Compromisso excluído.")
        onClose()
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao excluir.")
      }
    })
  }

  const phone = appointment?.lead?.phone ?? appointment?.client?.phone ?? null

  return (
    <>
      <Sheet open={!!appointment} onOpenChange={(open) => !open && onClose()} side="right">
        {appointment ? (
          <div className="flex h-full flex-col">
            <div className="border-b border-border/60 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-lg font-semibold">
                    {appointment.lead?.name ?? appointment.client?.name ?? "Compromisso"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(appointment.scheduledAt).toLocaleString("pt-BR", {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" · "}
                    {appointment.durationMinutes} min
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Fechar"
                  onClick={onClose}
                  className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <AppointmentTypeBadge type={appointment.type} />
                <AppointmentStatusBadge status={appointment.status} />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditOpen(true)}>
                  <Pencil className="size-3.5" /> Editar
                </Button>
                <Select value={appointment.status} onValueChange={(v) => handleStatusChange(v as AppointmentStatus)}>
                  <SelectTrigger className="h-8 w-40 text-xs" disabled={isPending}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive">
                      <Trash2 className="size-3.5" /> Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir este compromisso?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Essa ação não pode ser desfeita. Se o compromisso só não vai mais acontecer, prefira
                        marcar como &ldquo;Cancelado&rdquo; em vez de excluir.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel />
                      <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">Corretor</p>
                <p className="font-medium">{appointment.realtor.user.name}</p>
              </div>

              {appointment.lead ? (
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">Lead vinculado</p>
                  <Link href={`/admin/leads/${appointment.lead.id}`} className="font-medium text-primary hover:underline">
                    {appointment.lead.name}
                  </Link>
                </div>
              ) : null}

              {appointment.client ? (
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">Cliente vinculado</p>
                  <p className="font-medium">{appointment.client.name}</p>
                </div>
              ) : null}

              {phone ? (
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline" className="gap-1.5">
                    <a href={`tel:${phone}`}>
                      <Phone className="size-3.5" /> Ligar
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="gap-1.5">
                    <a
                      href={`https://wa.me/${phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <WhatsAppIcon className="size-3.5" /> WhatsApp
                    </a>
                  </Button>
                </div>
              ) : null}

              {appointment.property ? (
                <div className="rounded-xl border border-border/60 p-3 text-sm">
                  <p className="font-medium">{appointment.property.title}</p>
                  <p className="text-muted-foreground">{appointment.property.code}</p>
                </div>
              ) : null}

              {appointment.notes ? (
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">Observações</p>
                  <p>{appointment.notes}</p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </Sheet>

      {appointment ? (
        <AppointmentFormSheet
          open={editOpen}
          onOpenChange={setEditOpen}
          realtors={realtors}
          appointment={appointment}
        />
      ) : null}
    </>
  )
}
