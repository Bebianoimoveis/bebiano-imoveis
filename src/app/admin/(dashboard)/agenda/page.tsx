import Link from "next/link"
import { CalendarDays, ChevronRight, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { DashboardSection } from "@/components/admin/dashboard/dashboard-section"
import { AppointmentKpis } from "@/components/admin/agenda/appointment-kpis"
import { AppointmentCreateButton } from "@/components/admin/agenda/appointment-create-button"
import { AppointmentIcsButton } from "@/components/admin/agenda/appointment-ics-button"
import { AppointmentViewToggle, type AppointmentView } from "@/components/admin/agenda/appointment-view-toggle"
import { AppointmentDateNav } from "@/components/admin/agenda/appointment-date-nav"
import { AppointmentBoard } from "@/components/admin/agenda/appointment-board"
import { getAppointmentStats, listAdminAppointments } from "@/modules/appointment/actions"
import { listRealtors } from "@/modules/realtor/actions"
import { auth } from "@/lib/auth"
import { cn } from "@/lib/utils"

type SearchParams = Record<string, string | string[] | undefined>

function paramString(params: SearchParams, key: string) {
  const value = params[key]
  return typeof value === "string" ? value : undefined
}

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function monthGridRange(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const start = new Date(first)
  start.setDate(start.getDate() - start.getDay())
  const end = new Date(start)
  end.setDate(end.getDate() + 41)
  return { from: startOfDay(start), to: endOfDay(end) }
}

function weekRange(anchor: Date) {
  const start = new Date(anchor)
  start.setDate(start.getDate() - start.getDay())
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return { from: startOfDay(start), to: endOfDay(end) }
}

export default async function AdminAgendaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const view = (paramString(params, "view") as AppointmentView) ?? "list"
  const validViews: AppointmentView[] = ["list", "kanban", "month", "week", "day"]
  const activeView = validViews.includes(view) ? view : "list"

  const anchorParam = paramString(params, "date")
  const anchor = anchorParam ? new Date(`${anchorParam}T00:00:00`) : new Date()

  const mine = paramString(params, "mine") === "true"

  let range: { from: Date; to: Date }
  if (activeView === "month") range = monthGridRange(anchor)
  else if (activeView === "week") range = weekRange(anchor)
  else if (activeView === "day") range = { from: startOfDay(anchor), to: endOfDay(anchor) }
  else if (activeView === "kanban") {
    const from = new Date()
    from.setDate(from.getDate() - 30)
    const to = new Date()
    to.setDate(to.getDate() + 90)
    range = { from: startOfDay(from), to: endOfDay(to) }
  } else {
    const from = new Date()
    const to = new Date()
    to.setDate(to.getDate() + 90)
    range = { from: startOfDay(from), to: endOfDay(to) }
  }

  const filters = {
    from: range.from,
    to: range.to,
    mine,
  }

  const [session, appointments, stats, realtors] = await Promise.all([
    auth(),
    listAdminAppointments(filters),
    getAppointmentStats(filters),
    listRealtors(),
  ])
  const currentRealtorId = session?.user?.realtorId ?? null

  function buildHref(overrides: { view?: AppointmentView; date?: string; mine?: boolean }) {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") search.set(key, value)
    }
    if (overrides.view) search.set("view", overrides.view)
    if (overrides.date) search.set("date", overrides.date)
    if (overrides.mine !== undefined) {
      if (overrides.mine) search.set("mine", "true")
      else search.delete("mine")
    }
    const query = search.toString()
    return query ? `/admin/agenda?${query}` : "/admin/agenda"
  }

  const showDateNav = activeView === "month" || activeView === "week" || activeView === "day"

  return (
    <div className="space-y-6">
      <DashboardSection index={0} className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/admin" className="hover:text-foreground">
              Visão Geral
            </Link>
            <ChevronRight className="size-3" />
            <span>Agenda</span>
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Agenda</h1>
          <p className="text-sm text-muted-foreground">
            Visitas, ligações e compromissos organizados numa agenda inteligente.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AppointmentIcsButton />
          <AppointmentCreateButton realtors={realtors} currentRealtorId={currentRealtorId} />
        </div>
      </DashboardSection>

      <DashboardSection index={1}>
        <AppointmentKpis stats={stats} />
      </DashboardSection>

      <DashboardSection index={2} className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {showDateNav ? (
            <AppointmentDateNav
              anchor={anchor}
              view={activeView as "month" | "week" | "day"}
              buildHref={(date) => buildHref({ date: date.toISOString().slice(0, 10) })}
            />
          ) : null}
          <Link
            href={buildHref({ mine: !mine })}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-lg border border-border/60 px-2.5 text-xs font-medium transition-colors",
              mine ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <User className="size-3.5" />
            Meu Dia
          </Link>
        </div>
        <AppointmentViewToggle view={activeView} buildHref={(v) => buildHref({ view: v })} />
      </DashboardSection>

      <DashboardSection index={3}>
        {appointments.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nenhum compromisso neste período"
            description="Visitas, ligações e retornos aparecem aqui assim que forem agendados."
            action={<AppointmentCreateButton realtors={realtors} currentRealtorId={currentRealtorId} />}
          />
        ) : (
          <AppointmentBoard appointments={appointments} view={activeView} anchor={anchor} realtors={realtors} />
        )}
      </DashboardSection>
    </div>
  )
}
