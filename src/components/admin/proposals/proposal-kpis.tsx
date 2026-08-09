import { Ban, CalendarX, CheckCircle2, Clock, Handshake, PercentCircle, Wallet } from "lucide-react"

import { StatCard } from "@/components/admin/dashboard/stat-card"
import { formatCurrency } from "@/lib/format"

type Stats = {
  open: number
  negotiating: number
  accepted: number
  rejected: number
  completed: number
  expired: number
  totalNegotiatingValue: number
  closedValue: number
  conversionRate: number
}

export function ProposalKpis({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4 xl:grid-cols-4">
      <StatCard
        icon={<Clock className="size-5" />}
        label="Propostas abertas"
        value={String(stats.open)}
        description="Rascunho, enviada, visualizada"
      />
      <StatCard
        icon={<Handshake className="size-5" />}
        label="Em negociação"
        value={String(stats.negotiating)}
        description="Estágio ativo"
      />
      <StatCard
        icon={<CheckCircle2 className="size-5" />}
        label="Aceitas"
        value={String(stats.accepted)}
        description="Aguardando conclusão"
      />
      <StatCard
        icon={<Ban className="size-5" />}
        label="Recusadas"
        value={String(stats.rejected)}
        description="Fora do funil"
      />
      <StatCard
        icon={<CalendarX className="size-5" />}
        label="Expiradas"
        value={String(stats.expired)}
        description="Validade vencida"
      />
      <StatCard
        icon={<Wallet className="size-5" />}
        label="Valor em negociação"
        value={formatCurrency(stats.totalNegotiatingValue)}
        description="Soma dos estágios ativos"
      />
      <StatCard
        icon={<Wallet className="size-5" />}
        label="Valor fechado"
        value={formatCurrency(stats.closedValue)}
        description="Negócios concluídos"
      />
      <StatCard
        icon={<PercentCircle className="size-5" />}
        label="Taxa de conversão"
        value={`${stats.conversionRate}%`}
        description="Concluídas / total"
      />
      <StatCard
        icon={<CheckCircle2 className="size-5" />}
        label="Concluídas"
        value={String(stats.completed)}
        description="Negócios fechados"
      />
    </div>
  )
}
