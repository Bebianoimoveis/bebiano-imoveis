import { FinancialExportButton } from "@/components/admin/financial/financial-export-button"
import { formatCurrency } from "@/lib/format"
import type {
  getIncomeByRealtor,
  getIncomeByCity,
  getTopProperties,
  getCommissionsByRealtor,
  getExpenseByCategory,
  getKpiData,
} from "@/modules/financial/repository"

type ReportBlockProps = {
  title: string
  description: string
  children: React.ReactNode
  exportFilters?: Record<string, string>
}

function ReportBlock({ title, description, children, exportFilters }: ReportBlockProps) {
  return (
    <div className="space-y-3 rounded-[20px] border border-border/60 bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-heading text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <FinancialExportButton filters={exportFilters ?? {}} />
      </div>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 py-2 text-sm last:border-0">
      <span className="truncate text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

export function FinancialReportsPanel({
  incomeByRealtor,
  incomeByCity,
  topProperties,
  commissions,
  expenseByCategory,
  kpis,
}: {
  incomeByRealtor: Awaited<ReturnType<typeof getIncomeByRealtor>>
  incomeByCity: Awaited<ReturnType<typeof getIncomeByCity>>
  topProperties: Awaited<ReturnType<typeof getTopProperties>>
  commissions: Awaited<ReturnType<typeof getCommissionsByRealtor>>
  expenseByCategory: Awaited<ReturnType<typeof getExpenseByCategory>>
  kpis: Awaited<ReturnType<typeof getKpiData>>
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ReportBlock title="Receita por corretor" description="Receitas com corretor vinculado" exportFilters={{ type: "INCOME" }}>
        {incomeByRealtor.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
        ) : (
          incomeByRealtor.map((r) => <Row key={r.realtorId} label={r.name} value={formatCurrency(r.total)} />)
        )}
      </ReportBlock>

      <ReportBlock title="Receita por cidade" description="Receitas com imóvel vinculado" exportFilters={{ type: "INCOME" }}>
        {incomeByCity.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
        ) : (
          incomeByCity.map((c) => <Row key={c.city} label={c.city} value={formatCurrency(c.total)} />)
        )}
      </ReportBlock>

      <ReportBlock title="Imóveis mais rentáveis" description="Ranking por receita vinculada" exportFilters={{ type: "INCOME" }}>
        {topProperties.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
        ) : (
          topProperties.map((p) => <Row key={p.propertyId} label={`${p.code} · ${p.title}`} value={formatCurrency(p.total)} />)
        )}
      </ReportBlock>

      <ReportBlock title="Comissões" description="Por corretor — paga vs. pendente" exportFilters={{ category: "Comissão" }}>
        {commissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
        ) : (
          commissions.map((c) => (
            <Row key={c.realtorId} label={c.name} value={`${formatCurrency(c.commissionPaid)} pago`} />
          ))
        )}
      </ReportBlock>

      <ReportBlock title="Despesas por categoria" description="Distribuição das despesas" exportFilters={{ type: "EXPENSE" }}>
        {expenseByCategory.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
        ) : (
          expenseByCategory.map((e) => <Row key={e.category} label={e.category} value={formatCurrency(e.total)} />)
        )}
      </ReportBlock>

      <ReportBlock title="Fluxo de caixa / Lucro" description="Resumo do mês corrente e do ano">
        <Row label="Receita do mês" value={formatCurrency(kpis.currentMonth.income)} />
        <Row label="Despesa do mês" value={formatCurrency(kpis.currentMonth.expense)} />
        <Row label="Lucro do mês" value={formatCurrency(kpis.currentMonth.income - kpis.currentMonth.expense)} />
        <Row label="Receita do ano" value={formatCurrency(kpis.year.income)} />
        <Row label="Despesa do ano" value={formatCurrency(kpis.year.expense)} />
        <Row label="Lucro do ano" value={formatCurrency(kpis.year.income - kpis.year.expense)} />
      </ReportBlock>
    </div>
  )
}
