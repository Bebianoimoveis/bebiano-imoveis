import { Building2, CalendarCheck, DollarSign, FileText, Home, Ban } from "lucide-react"

import { auth } from "@/lib/auth"
import { getPermissions } from "@/lib/permissions"
import { getDashboardMetrics } from "@/modules/report/actions"
import { formatCurrency } from "@/lib/format"
import { StatCard } from "@/components/admin/dashboard/stat-card"
import { LeadsOriginChart } from "@/components/admin/dashboard/leads-origin-chart"
import { SalesChart } from "@/components/admin/dashboard/sales-chart"
import { LeadsFunnelChart } from "@/components/admin/dashboard/leads-funnel-chart"
import { TopPropertiesCard } from "@/components/admin/dashboard/top-properties-card"
import { ActivityTimeline } from "@/components/admin/dashboard/activity-timeline"
import { QuickActions } from "@/components/admin/dashboard/quick-actions"
import { PeriodSelect } from "@/components/admin/dashboard/period-select"
import { DashboardSection } from "@/components/admin/dashboard/dashboard-section"

type SearchParams = Record<string, string | string[] | undefined>

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const periodDays = Number(params.periodo) || 30

  const session = await auth()
  const [metrics, permissions] = await Promise.all([
    getDashboardMetrics(periodDays),
    getPermissions(session?.user),
  ])

  const firstName = session?.user?.name?.split(" ")[0] ?? "por aqui"

  return (
    <div className="space-y-8">
      <DashboardSection index={0} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Olá, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Aqui está o resumo geral da Bebiano Imóveis.
          </p>
        </div>
        <PeriodSelect periodDays={periodDays} />
      </DashboardSection>

      <DashboardSection index={1} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Home className="size-5" />}
          label="Imóveis publicados"
          value={String(metrics.propertyStatus.published)}
          description="Ativos no site"
        />
        <StatCard
          icon={<DollarSign className="size-5" />}
          label="Vendas no mês"
          value={formatCurrency(metrics.salesInPeriod.total.toString())}
          description={`${metrics.salesInPeriod.count} contrato(s)`}
        />
        <StatCard
          icon={<Ban className="size-5" />}
          label="Imóveis indisponíveis"
          value={String(metrics.propertyStatus.unavailable)}
          description="Fora do ar"
        />
        <StatCard
          icon={<Building2 className="size-5" />}
          label="Novos leads"
          value={String(metrics.newLeads.value)}
          description={`Últimos ${periodDays} dias`}
          currentValue={metrics.newLeads.value}
          previousValue={metrics.newLeads.previousValue}
        />
        <StatCard
          icon={<CalendarCheck className="size-5" />}
          label="Visitas agendadas"
          value={String(metrics.upcomingAppointments)}
          description="Próximos agendamentos"
        />
        <StatCard
          icon={<FileText className="size-5" />}
          label="Propostas abertas"
          value={String(metrics.openProposals)}
          description={`${metrics.newProposals.value} nova(s) no período`}
          currentValue={metrics.newProposals.value}
          previousValue={metrics.newProposals.previousValue}
        />
      </DashboardSection>

      <DashboardSection index={2} className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[20px] border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-heading text-base font-semibold">Leads por origem</h2>
          <LeadsOriginChart data={metrics.leadsByOrigin} />
        </div>
        <div className="rounded-[20px] border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-heading text-base font-semibold">Vendas no período</h2>
          <SalesChart data={metrics.salesByMonth} />
        </div>
      </DashboardSection>

      <DashboardSection index={3} className="rounded-[20px] border border-border/60 bg-card p-5 shadow-sm">
        <h2 className="mb-4 font-heading text-base font-semibold">Funil comercial</h2>
        <LeadsFunnelChart data={metrics.leadsByStage} />
      </DashboardSection>

      <DashboardSection index={4} className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[20px] border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="mb-3 font-heading text-base font-semibold">Imóveis mais visualizados</h2>
          <TopPropertiesCard properties={metrics.topViewed} />
        </div>
        <div className="rounded-[20px] border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-heading text-base font-semibold">Atividades recentes</h2>
          <ActivityTimeline items={metrics.activity} />
        </div>
      </DashboardSection>

      <DashboardSection index={5}>
        <h2 className="mb-3 font-heading text-base font-semibold">Ações rápidas</h2>
        <QuickActions permissions={permissions} />
      </DashboardSection>
    </div>
  )
}
