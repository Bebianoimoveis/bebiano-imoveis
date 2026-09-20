import {
  Archive,
  Banknote,
  Building2,
  CheckCircle2,
  Eye,
  FileEdit,
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
      <StatCard
        icon={<Building2 className="size-5" />}
        label="Total"
        value={String(stats.total)}
        description="No portfólio"
        href="/admin/imoveis"
      />
      <StatCard
        icon={<CheckCircle2 className="size-5" />}
        label="Publicados"
        value={String(c.PUBLISHED ?? 0)}
        description="Ativos no site"
        href="/admin/imoveis?status=PUBLISHED"
      />
      <StatCard
        icon={<FileEdit className="size-5" />}
        label="Rascunho"
        value={String(c.DRAFT ?? 0)}
        description="Ainda não publicado"
        href="/admin/imoveis?status=DRAFT"
      />
      <StatCard
        icon={<Handshake className="size-5" />}
        label="Reservados"
        value={String(c.RESERVED ?? 0)}
        description="Negociação em curso"
        href="/admin/imoveis?status=RESERVED"
      />
      <StatCard
        icon={<TrendingUp className="size-5" />}
        label="Vendidos"
        value={String((c.SOLD ?? 0) + (c.RENTED ?? 0))}
        description="Concluídos"
        href="/admin/imoveis?status=SOLD"
      />
      <StatCard
        icon={<Archive className="size-5" />}
        label="Arquivados"
        value={String(c.ARCHIVED ?? 0)}
        description="Fora da listagem ativa"
        href="/admin/imoveis?status=ARCHIVED"
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
