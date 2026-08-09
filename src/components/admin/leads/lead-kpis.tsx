import {
  Ban,
  CalendarCheck,
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
  UserPlus,
  Users2,
} from "lucide-react"

import { StatCard } from "@/components/admin/dashboard/stat-card"

type Stats = {
  total: number
  countByStage: Record<string, number>
  newInPeriod: number
  visitsToday: number
  openProposals: number
  avgDaysToClose: number | null
}

export function LeadKpis({ stats }: { stats: Stats }) {
  const c = stats.countByStage
  const closed = c.CLOSED ?? 0
  const lost = c.LOST ?? 0
  const emAtendimento = stats.total - (c.NEW ?? 0) - closed - lost
  const conversion = stats.total > 0 ? Math.round((closed / stats.total) * 100) : 0

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4 xl:grid-cols-4">
      <StatCard
        icon={<UserPlus className="size-5" />}
        label="Novos leads"
        value={String(stats.newInPeriod)}
        description="Últimos 30 dias"
      />
      <StatCard
        icon={<Users2 className="size-5" />}
        label="Em atendimento"
        value={String(Math.max(emAtendimento, 0))}
        description="Fora de novo/fechado/perdido"
      />
      <StatCard
        icon={<CalendarCheck className="size-5" />}
        label="Visitas hoje"
        value={String(stats.visitsToday)}
        description="Agendadas para hoje"
      />
      <StatCard
        icon={<FileText className="size-5" />}
        label="Propostas"
        value={String(stats.openProposals)}
        description="Em aberto"
      />
      <StatCard
        icon={<CheckCircle2 className="size-5" />}
        label="Fechados"
        value={String(closed)}
        description="Negócios concluídos"
      />
      <StatCard
        icon={<Ban className="size-5" />}
        label="Perdidos"
        value={String(lost)}
        description="Fora do funil"
      />
      <StatCard
        icon={<TrendingUp className="size-5" />}
        label="Conversão"
        value={`${conversion}%`}
        description="Fechados / total"
      />
      <StatCard
        icon={<Clock className="size-5" />}
        label="Tempo médio"
        value={stats.avgDaysToClose !== null ? `${stats.avgDaysToClose.toFixed(0)}d` : "—"}
        description="Até o fechamento"
      />
    </div>
  )
}
