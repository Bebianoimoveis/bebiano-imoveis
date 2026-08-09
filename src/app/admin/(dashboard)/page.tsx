import { ArrowUpCircle, Ban, Building2, CalendarCheck, Clock, DollarSign, FileText, Home } from "lucide-react"

import { auth } from "@/lib/auth"
import { getPermissions } from "@/lib/permissions"
import { getDashboardMetrics, getDashboardSidePanel } from "@/modules/report/actions"
import { getFinancialKpis } from "@/modules/financial/actions"
import { formatCurrency } from "@/lib/format"
import { StatCard } from "@/components/admin/dashboard/stat-card"
import { DashboardGreetingBar } from "@/components/admin/dashboard/dashboard-greeting-bar"
import { DashboardInsightBanner } from "@/components/admin/dashboard/dashboard-insight-banner"
import { DashboardSidePanel } from "@/components/admin/dashboard/dashboard-side-panel"
import { MonthlyGoalCard } from "@/components/admin/dashboard/monthly-goal-card"
import { LeadsOriginChart } from "@/components/admin/dashboard/leads-origin-chart"
import { SalesChart } from "@/components/admin/dashboard/sales-chart"
import { LeadsFunnelChart } from "@/components/admin/dashboard/leads-funnel-chart"
import { TopPropertiesCard } from "@/components/admin/dashboard/top-properties-card"
import { ActivityTimeline } from "@/components/admin/dashboard/activity-timeline"
import { QuickActions } from "@/components/admin/dashboard/quick-actions"
import { PeriodSelect } from "@/components/admin/dashboard/period-select"
import { DashboardSection } from "@/components/admin/dashboard/dashboard-section"

type SearchParams = Record<string, string | string[] | undefined>

function growthPercent(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null
  return Math.round(((current - previous) / previous) * 100)
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const periodDays = Number(params.periodo) || 30

  const session = await auth()
  const [metrics, permissions, sidePanel, financialKpis] = await Promise.all([
    getDashboardMetrics(periodDays),
    getPermissions(session?.user),
    getDashboardSidePanel(),
    // Sem financial.view o card fica de fora — mesma permissão que já
    // esconde o módulo Financeiro do menu.
    getFinancialKpis().catch(() => null),
  ])

  const firstName = session?.user?.name?.split(" ")[0] ?? "por aqui"
  const activityGrowthPercent = growthPercent(metrics.newLeads.value, metrics.newLeads.previousValue)

  return (
    <div className="space-y-8">
      <DashboardSection index={0} className="space-y-4">
        <DashboardGreetingBar
          firstName={firstName}
          permissionKeys={[...permissions]}
          extra={<PeriodSelect periodDays={periodDays} />}
        />
        <DashboardInsightBanner alertsCount={sidePanel.alerts.length} activityGrowthPercent={activityGrowthPercent} />
      </DashboardSection>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-8">
          <DashboardSection index={1} className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
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
            {financialKpis ? (
              <>
                <StatCard
                  icon={<ArrowUpCircle className="size-5" />}
                  label="Receita do mês"
                  value={formatCurrency(financialKpis.currentMonth.income)}
                  description="Vencimento no mês corrente"
                  currentValue={financialKpis.currentMonth.income}
                  previousValue={financialKpis.previousMonth.income}
                />
                <StatCard
                  icon={<Clock className="size-5" />}
                  label="A receber"
                  value={formatCurrency(financialKpis.pendingIncome)}
                  description="Pendente de recebimento"
                />
              </>
            ) : null}
          </DashboardSection>

          <DashboardSection index={2}>
            <h2 className="mb-3 font-heading text-base font-semibold">Vendas &amp; Metas</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[20px] border border-border/60 bg-card p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-medium text-muted-foreground">Vendas no período</h3>
                <SalesChart data={metrics.salesByMonth} />
              </div>
              <MonthlyGoalCard />
            </div>
          </DashboardSection>

          <DashboardSection index={3} className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[20px] border border-border/60 bg-card p-5 shadow-sm">
              <h2 className="mb-4 font-heading text-base font-semibold">Leads por origem</h2>
              <LeadsOriginChart data={metrics.leadsByOrigin} />
            </div>
            <div className="rounded-[20px] border border-border/60 bg-card p-5 shadow-sm">
              <h2 className="mb-4 font-heading text-base font-semibold">Funil comercial</h2>
              <LeadsFunnelChart data={metrics.leadsByStage} />
            </div>
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

        <DashboardSidePanel data={sidePanel} />
      </div>
    </div>
  )
}
