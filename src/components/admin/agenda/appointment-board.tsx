"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  DndContext,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { toast } from "sonner"

import { AppointmentList } from "@/components/admin/agenda/appointment-list"
import { AppointmentKanban } from "@/components/admin/agenda/appointment-kanban"
import { AppointmentMonthView } from "@/components/admin/agenda/appointment-month-view"
import { AppointmentTimeGrid } from "@/components/admin/agenda/appointment-time-grid"
import { AppointmentDetailPanel } from "@/components/admin/agenda/appointment-detail-panel"
import { rescheduleAppointment } from "@/modules/appointment/actions"
import type { AppointmentListItem } from "@/modules/appointment/repository"
import type { AppointmentView } from "@/components/admin/agenda/appointment-view-toggle"

type RealtorOption = { id: string; user: { name: string } }

function buildWeekDays(anchor: Date) {
  const start = new Date(anchor)
  start.setDate(start.getDate() - start.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    return date
  })
}

export function AppointmentBoard({
  appointments: initialAppointments,
  view,
  anchor,
  realtors,
}: {
  appointments: AppointmentListItem[]
  view: AppointmentView
  anchor: Date
  realtors: RealtorOption[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  function navigateToDay(date: Date) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("view", "day")
    params.set("date", date.toISOString().slice(0, 10))
    router.push(`${pathname}?${params.toString()}`)
  }
  const [appointments, setAppointments] = useState(initialAppointments)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => setAppointments(initialAppointments), [initialAppointments])

  const openAppointment = appointments.find((a) => a.id === openId) ?? null

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  // Always remedir os droppables — a grade tem muitas células (até 98 no
  // modo semana); sem isso, drags rápidos ocasionalmente perdiam a
  // colisão correta.
  const measuring = useMemo(() => ({ droppable: { strategy: MeasuringStrategy.Always } }), [])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const appointment = appointments.find((a) => a.id === active.id)
    if (!appointment) return

    const [dayIso, hourStr] = String(over.id).split("|")
    const hour = Number(hourStr)
    const [year, month, day] = dayIso.split("-").map(Number)
    const newDate = new Date(appointment.scheduledAt)
    newDate.setFullYear(year, month - 1, day)
    newDate.setHours(hour, 0, 0, 0)

    if (newDate.getTime() === new Date(appointment.scheduledAt).getTime()) return

    const previous = appointment.scheduledAt
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointment.id ? { ...a, scheduledAt: newDate } : a))
    )

    rescheduleAppointment(appointment.id, { scheduledAt: newDate })
      .then(() => {
        toast.success("Compromisso reagendado.")
        router.refresh()
      })
      .catch((error) => {
        setAppointments((prev) =>
          prev.map((a) => (a.id === appointment.id ? { ...a, scheduledAt: previous } : a))
        )
        toast.error(error instanceof Error ? error.message : "Erro ao reagendar.")
      })
  }

  return (
    <>
      {view === "list" ? <AppointmentList appointments={appointments} onOpenAppointment={setOpenId} /> : null}

      {view === "kanban" ? (
        <AppointmentKanban appointments={appointments} onOpenAppointment={setOpenId} />
      ) : null}

      {view === "month" ? (
        <>
          <div className="hidden md:block">
            <AppointmentMonthView
              anchor={anchor}
              appointments={appointments}
              onOpenAppointment={setOpenId}
              onOpenDay={navigateToDay}
            />
          </div>
          <div className="md:hidden">
            <AppointmentList appointments={appointments} onOpenAppointment={setOpenId} />
          </div>
        </>
      ) : null}

      {view === "week" ? (
        <>
          <div className="hidden md:block">
            <DndContext sensors={sensors} autoScroll={false} measuring={measuring} onDragEnd={handleDragEnd}>
              <AppointmentTimeGrid days={buildWeekDays(anchor)} appointments={appointments} onOpenAppointment={setOpenId} />
            </DndContext>
          </div>
          <div className="md:hidden">
            <AppointmentList appointments={appointments} onOpenAppointment={setOpenId} />
          </div>
        </>
      ) : null}

      {view === "day" ? (
        <>
          <div className="hidden md:block">
            <DndContext sensors={sensors} autoScroll={false} measuring={measuring} onDragEnd={handleDragEnd}>
              <AppointmentTimeGrid days={[anchor]} appointments={appointments} onOpenAppointment={setOpenId} />
            </DndContext>
          </div>
          <div className="md:hidden">
            <AppointmentList appointments={appointments} onOpenAppointment={setOpenId} />
          </div>
        </>
      ) : null}

      <AppointmentDetailPanel appointment={openAppointment} onClose={() => setOpenId(null)} realtors={realtors} />
    </>
  )
}
