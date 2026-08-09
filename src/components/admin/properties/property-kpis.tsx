import {
  Archive,
  Banknote,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  Handshake,
  MessagesSquare,
  TrendingUp,
} from "lucide-react"

import { StatCard } from "@/components/admin/dashboard/stat-card"
import { formatCurrency } from "@/lib/format"

type Stats = {
  total: number
  countByStatus: Record<string, number>
  totalValue: { toString(): string }
  totalViews: number
  totalLeads: number
}

export function PropertyKpis({ stats }: { stats: Stats }) {
  const c = stats.countByStatus

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      <StatCard icon={<Building2 className="size-5" />} label="Total" value={String(stats.total)} description="No portfólio" />
      <StatCard
        icon={<CheckCircle2 className="size-5" />}
        label="Publicados"
        value={String(c.PUBLISHED ?? 0)}
        description="Ativos no site"
      />
      <StatCard
        icon={<Clock className="size-5" />}
        label="Em análise"
        value={String(c.IN_REVIEW ?? 0)}
        description="Aguardando revisão"
      />
      <StatCard
        icon={<Handshake className="size-5" />}
        label="Reservados"
        value={String(c.RESERVED ?? 0)}
        description="Negociação em curso"
      />
      <StatCard
        icon={<TrendingUp className="size-5" />}
        label="Vendidos"
        value={String((c.SOLD ?? 0) + (c.RENTED ?? 0))}
        description="Concluídos"
      />
      <StatCard
        icon={<Archive className="size-5" />}
        label="Arquivados"
        value={String(c.ARCHIVED ?? 0)}
        description="Fora da listagem ativa"
      />
      <StatCard
        icon={<Banknote className="size-5" />}
        label="Valor do portfólio"
        value={formatCurrency(stats.totalValue.toString())}
        description="Soma dos publicados"
      />
      <StatCard
        icon={<Eye className="size-5" />}
        label="Visualizações"
        value={String(stats.totalViews)}
        description="Acumulado no site"
      />
      <StatCard
        icon={<MessagesSquare className="size-5" />}
        label="Leads gerados"
        value={String(stats.totalLeads)}
        description="Vindos dos imóveis"
      />
    </div>
  )
}
