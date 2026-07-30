"use client"

import { useEffect, useState } from "react"
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { appointmentTypeDot } from "@/components/admin/agenda/appointment-type-badge"
import { updateAppointmentStatus } from "@/modules/appointment/actions"
import type { AppointmentListItem } from "@/modules/appointment/repository"
import type { AppointmentStatus } from "@/generated/prisma/client"

const COLUMNS: { status: AppointmentStatus; label: string; dot: string }[] = [
  { status: "SCHEDULED", label: "Agendado", dot: "bg-muted-foreground" },
  { status: "CONFIRMED", label: "Confirmado", dot: "bg-primary" },
  { status: "DONE", label: "Realizado", dot: "bg-emerald-500" },
  { status: "NO_SHOW", label: "Não compareceu", dot: "bg-destructive" },
  { status: "CANCELED", label: "Cancelado", dot: "bg-muted-foreground" },
]

function KanbanCard({
  appointment,
  onOpen,
}: {
  appointment: AppointmentListItem
  onOpen: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: appointment.id,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => !isDragging && onOpen(appointment.id)}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "w-full cursor-grab touch-none space-y-1 rounded-xl border border-border/60 bg-card p-3 text-left text-sm shadow-sm transition-shadow select-none hover:shadow-md active:cursor-grabbing",
        isDragging && "z-20 opacity-70 shadow-xl"
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className={cn("size-1.5 shrink-0 rounded-full", appointmentTypeDot(appointment.type))} />
        <span className="truncate font-medium">
          {appointment.lead?.name ?? appointment.client?.name ?? "Compromisso"}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {new Date(appointment.scheduledAt).toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
      <p className="text-xs text-muted-foreground">{appointment.realtor.user.name}</p>
    </div>
  )
}

function KanbanColumn({
  status,
  label,
  dot,
  appointments,
  onOpen,
}: {
  status: AppointmentStatus
  label: string
  dot: string
  appointments: AppointmentListItem[]
  onOpen: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-[20px] border border-border/60 bg-secondary/20 p-3 transition-colors",
        isOver && "ring-2 ring-primary/40 bg-primary/5"
      )}
    >
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className={cn("size-2 rounded-full", dot)} />
        <p className="text-sm font-semibold">{label}</p>
        <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-secondary text-[11px] font-medium text-muted-foreground">
          {appointments.length}
        </span>
      </div>
      <div className="max-h-[calc(100vh-26rem)] space-y-2 overflow-y-auto">
        {appointments.map((appointment) => (
          <KanbanCard key={appointment.id} appointment={appointment} onOpen={onOpen} />
        ))}
      </div>
    </div>
  )
}

export function AppointmentKanban({
  appointments: initialAppointments,
  onOpenAppointment,
}: {
  appointments: AppointmentListItem[]
  onOpenAppointment: (id: string) => void
}) {
  const router = useRouter()
  const [appointments, setAppointments] = useState(initialAppointments)
  useEffect(() => setAppointments(initialAppointments), [initialAppointments])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const newStatus = over.id as AppointmentStatus
    const appointment = appointments.find((a) => a.id === active.id)
    if (!appointment || appointment.status === newStatus) return

    const previousStatus = appointment.status
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointment.id ? { ...a, status: newStatus } : a))
    )

    updateAppointmentStatus(appointment.id, newStatus)
      .then(() => {
        toast.success("Status atualizado.")
        router.refresh()
      })
      .catch((error) => {
        setAppointments((prev) =>
          prev.map((a) => (a.id === appointment.id ? { ...a, status: previousStatus } : a))
        )
        toast.error(error instanceof Error ? error.message : "Erro ao mover.")
      })
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.status}
            status={column.status}
            label={column.label}
            dot={column.dot}
            appointments={appointments.filter((a) => a.status === column.status)}
            onOpen={onOpenAppointment}
          />
        ))}
      </div>
    </DndContext>
  )
}
