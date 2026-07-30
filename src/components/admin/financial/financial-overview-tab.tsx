import { FinancialKpis } from "@/components/admin/financial/financial-kpis"
import { FinancialAlertsBanner } from "@/components/admin/financial/financial-alerts-banner"
import { FinancialIncomeExpenseChart } from "@/components/admin/financial/financial-income-expense-chart"
import { FinancialExpenseCategoryChart } from "@/components/admin/financial/financial-expense-category-chart"
import { FinancialCashFlowChart } from "@/components/admin/financial/financial-cash-flow-chart"
import { FinancialIncomeByRealtorChart } from "@/components/admin/financial/financial-income-by-realtor-chart"
import { FinancialIncomeByCityChart } from "@/components/admin/financial/financial-income-by-city-chart"
import { FinancialProjectionCard } from "@/components/admin/financial/financial-projection-card"
import { DashboardSection } from "@/components/admin/dashboard/dashboard-section"
import type {
  getKpiData,
  getMonthlySeries,
  getExpenseByCategory,
  getCashFlowTimeline,
  getIncomeByRealtor,
  getIncomeByCity,
  getCommissionsByRealtor,
} from "@/modules/financial/repository"

export function FinancialOverviewTab({
  kpis,
  monthlySeries,
  expenseByCategory,
  cashFlow,
  incomeByRealtor,
  incomeByCity,
  commissions,
  potentialCommission,
  availableBalance,
  overdueCount,
  goalsHit,
}: {
  kpis: Awaited<ReturnType<typeof getKpiData>>
  monthlySeries: Awaited<ReturnType<typeof getMonthlySeries>>
  expenseByCategory: Awaited<ReturnType<typeof getExpenseByCategory>>
  cashFlow: Awaited<ReturnType<typeof getCashFlowTimeline>>
  incomeByRealtor: Awaited<ReturnType<typeof getIncomeByRealtor>>
  incomeByCity: Awaited<ReturnType<typeof getIncomeByCity>>
  commissions: Awaited<ReturnType<typeof getCommissionsByRealtor>>
  potentialCommission: number
  availableBalance: number
  overdueCount: number
  goalsHit: number
}) {
  const monthBalance = kpis.currentMonth.income - kpis.currentMonth.expense

  return (
    <div className="space-y-6">
      <DashboardSection index={0}>
        <FinancialAlertsBanner overdueCount={overdueCount} monthBalance={monthBalance} goalsHit={goalsHit} />
      </DashboardSection>

      <DashboardSection index={1}>
        <FinancialKpis
          kpis={kpis}
          commissions={commissions}
          potentialCommission={potentialCommission}
          availableBalance={availableBalance}
        />
      </DashboardSection>

      <DashboardSection index={2} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[20px] border border-border/60 bg-card p-5">
          <p className="mb-4 font-heading text-sm font-semibold">Receita vs. Despesa por mês</p>
          <FinancialIncomeExpenseChart data={monthlySeries} />
        </div>
        <div className="rounded-[20px] border border-border/60 bg-card p-5">
          <p className="mb-4 font-heading text-sm font-semibold">Despesas por categoria</p>
          <FinancialExpenseCategoryChart data={expenseByCategory} />
        </div>
      </DashboardSection>

      <DashboardSection index={3} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[20px] border border-border/60 bg-card p-5">
          <p className="mb-4 font-heading text-sm font-semibold">Fluxo de caixa acumulado (mês)</p>
          <FinancialCashFlowChart data={cashFlow} />
        </div>
        <div className="rounded-[20px] border border-border/60 bg-card p-5">
          <p className="mb-4 font-heading text-sm font-semibold">Receita por corretor</p>
          <FinancialIncomeByRealtorChart data={incomeByRealtor} />
        </div>
      </DashboardSection>

      <DashboardSection index={4} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[20px] border border-border/60 bg-card p-5">
          <p className="mb-4 font-heading text-sm font-semibold">Receita por cidade</p>
          <FinancialIncomeByCityChart data={incomeByCity} />
        </div>
        <FinancialProjectionCard data={monthlySeries} />
      </DashboardSection>
    </div>
  )
}
