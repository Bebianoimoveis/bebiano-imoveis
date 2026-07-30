import { CalendarCheck, CalendarClock, CalendarX, CheckCircle2, Percent } from "lucide-react"

import { StatCard } from "@/components/admin/dashboard/stat-card"

type Stats = {
  today: number
  week: number
  confirmed: number
  pending: number
  attendanceRate: number | null
  canceled: number
}

export function AppointmentKpis({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        icon={<CalendarCheck className="size-5" />}
        label="Hoje"
        value={String(stats.today)}
        description="Compromissos hoje"
      />
      <StatCard
        icon={<CalendarClock className="size-5" />}
        label="Esta semana"
        value={String(stats.week)}
        description="No período"
      />
      <StatCard
        icon={<CheckCircle2 className="size-5" />}
        label="Confirmados"
        value={String(stats.confirmed)}
        description="Prontos pra acontecer"
      />
      <StatCard
        icon={<CalendarClock className="size-5" />}
        label="Pendentes"
        value={String(stats.pending)}
        description="Aguardando confirmação"
      />
      <StatCard
        icon={<Percent className="size-5" />}
        label="Comparecimento"
        value={stats.attendanceRate !== null ? `${stats.attendanceRate}%` : "—"}
        description="Realizados / (realizados + faltas)"
      />
      <StatCard
        icon={<CalendarX className="size-5" />}
        label="Cancelados"
        value={String(stats.canceled)}
        description="No período"
      />
    </div>
  )
}
