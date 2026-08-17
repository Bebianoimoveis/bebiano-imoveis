import { Banknote, Building2, TrendingUp, Users2 } from "lucide-react"

import { StatCard } from "@/components/admin/dashboard/stat-card"
import { formatCurrency } from "@/lib/format"

export function ReportKpis({
  salesThisMonth,
  newLeads,
  conversionRate,
  propertyStatus,
}: {
  salesThisMonth: { total: number; count: number }
  newLeads: { value: number; previousValue: number }
  conversionRate: number
  propertyStatus: { published: number; sold: number; rented: number; unavailable: number }
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
      <StatCard
        icon={<Banknote className="size-5" />}
        label="Vendas no mês"
        value={formatCurrency(salesThisMonth.total)}
        description={`${salesThisMonth.count} contrato${salesThisMonth.count === 1 ? "" : "s"}`}
      />
      <StatCard
        icon={<Users2 className="size-5" />}
        label="Novos leads (30 dias)"
        value={String(newLeads.value)}
        description="Comparado aos 30 dias anteriores"
        currentValue={newLeads.value}
        previousValue={newLeads.previousValue}
      />
      <StatCard
        icon={<TrendingUp className="size-5" />}
        label="Taxa de conversão"
        value={`${Math.round(conversionRate * 100)}%`}
        description="Leads que fecharam negócio"
      />
      <StatCard
        icon={<Building2 className="size-5" />}
        label="Imóveis publicados"
        value={String(propertyStatus.published)}
        description={`${propertyStatus.sold} vendido${propertyStatus.sold === 1 ? "" : "s"} · ${propertyStatus.rented} alugado${propertyStatus.rented === 1 ? "" : "s"}`}
      />
    </div>
  )
}
