import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  CircleDollarSign,
  Clock,
  PiggyBank,
  Receipt,
  TrendingDown,
  Wallet,
} from "lucide-react"

import { StatCard } from "@/components/admin/dashboard/stat-card"
import { formatCurrency } from "@/lib/format"
import type { getKpiData, getCommissionsByRealtor } from "@/modules/financial/repository"

type KpiData = Awaited<ReturnType<typeof getKpiData>>
type Commissions = Awaited<ReturnType<typeof getCommissionsByRealtor>>

export function FinancialKpis({
  kpis,
  commissions,
  potentialCommission,
  availableBalance,
}: {
  kpis: KpiData
  commissions: Commissions
  potentialCommission: number
  availableBalance: number
}) {
  const monthProfit = kpis.currentMonth.income - kpis.currentMonth.expense
  const previousProfit = kpis.previousMonth.income - kpis.previousMonth.expense
  const registeredCommission = commissions.reduce((sum, c) => sum + c.commissionPaid, 0)
  const pendingCommission = commissions.reduce((sum, c) => sum + c.commissionPending, 0)

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5">
      <StatCard
        icon={<ArrowUpCircle className="size-5" />}
        label="Receita do mês"
        value={formatCurrency(kpis.currentMonth.income)}
        description="Vencimento no mês corrente"
        currentValue={kpis.currentMonth.income}
        previousValue={kpis.previousMonth.income}
      />
      <StatCard
        icon={<Banknote className="size-5" />}
        label="Receita anual"
        value={formatCurrency(kpis.year.income)}
        description="Acumulado no ano"
      />
      <StatCard
        icon={<ArrowDownCircle className="size-5" />}
        label="Despesas do mês"
        value={formatCurrency(kpis.currentMonth.expense)}
        description="Vencimento no mês corrente"
        currentValue={kpis.currentMonth.expense}
        previousValue={kpis.previousMonth.expense}
      />
      <StatCard
        icon={<TrendingDown className="size-5" />}
        label="Lucro do mês"
        value={formatCurrency(monthProfit)}
        description="Receita − despesa do mês"
        currentValue={monthProfit}
        previousValue={previousProfit}
      />
      <StatCard
        icon={<Wallet className="size-5" />}
        label="Fluxo de caixa do mês"
        value={formatCurrency(monthProfit)}
        description="Saldo do período"
      />
      <StatCard
        icon={<Receipt className="size-5" />}
        label="Comissão potencial"
        value={formatCurrency(potentialCommission)}
        description="Propostas aceitas/concluídas"
      />
      <StatCard
        icon={<Receipt className="size-5" />}
        label="Comissão registrada"
        value={formatCurrency(registeredCommission)}
        description={`${formatCurrency(pendingCommission)} pendente`}
      />
      <StatCard
        icon={<Clock className="size-5" />}
        label="Recebimentos pendentes"
        value={formatCurrency(kpis.pendingIncome)}
        description="Receitas em aberto"
      />
      <StatCard
        icon={<AlertCircle className="size-5" />}
        label="Pagamentos pendentes"
        value={formatCurrency(kpis.pendingExpense)}
        description="Despesas em aberto"
      />
      <StatCard
        icon={<CircleDollarSign className="size-5" />}
        label="Ticket médio"
        value={formatCurrency(kpis.averageTicket)}
        description="Receitas recebidas"
      />
      <StatCard
        icon={<PiggyBank className="size-5" />}
        label="Saldo disponível"
        value={formatCurrency(availableBalance)}
        description="Receita paga − despesa paga"
      />
    </div>
  )
}
