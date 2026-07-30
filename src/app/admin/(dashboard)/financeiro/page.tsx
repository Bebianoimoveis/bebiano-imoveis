import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { DashboardSection } from "@/components/admin/dashboard/dashboard-section"
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FinancialTabs } from "@/components/admin/financial/financial-tabs"
import { FinancialSearch } from "@/components/admin/financial/financial-search"
import { FinancialFiltersSheet } from "@/components/admin/financial/financial-filters-sheet"
import { FinancialExportButton } from "@/components/admin/financial/financial-export-button"
import { FinancialCreateButtons } from "@/components/admin/financial/financial-create-buttons"
import { FinancialDirectory } from "@/components/admin/financial/financial-directory"
import { FinancialEmptyState } from "@/components/admin/financial/financial-empty-state"
import { FinancialOverviewTab } from "@/components/admin/financial/financial-overview-tab"
import { FinancialCommissionsPanel } from "@/components/admin/financial/financial-commissions-panel"
import { GoalsPanel } from "@/components/admin/financial/goals-panel"
import { FinancialReportsPanel } from "@/components/admin/financial/financial-reports-panel"
import { isEntryOverdue } from "@/components/admin/financial/financial-entry-status-badge"
import {
  listAdminFinancialEntries,
  getFinancialKpis,
  getFinancialMonthlySeries,
  getFinancialExpenseByCategory,
  getFinancialIncomeByRealtor,
  getFinancialIncomeByCity,
  getFinancialTopProperties,
  getFinancialCashFlowTimeline,
  getFinancialCommissionsByRealtor,
} from "@/modules/financial/actions"
import { listAdminGoals } from "@/modules/goal/actions"
import { listAdminProposals } from "@/modules/proposal/actions"
import { listAdminClients } from "@/modules/client/actions"
import { listAdminProperties } from "@/modules/property/actions"
import { listCities } from "@/modules/taxonomy/actions"
import { listRealtors } from "@/modules/realtor/actions"
import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"

type SearchParams = Record<string, string | string[] | undefined>

function paramString(params: SearchParams, key: string) {
  const value = params[key]
  return typeof value === "string" ? value : undefined
}

export default async function AdminFinancialPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const filters = {
    search: paramString(params, "search"),
    type: paramString(params, "type"),
    status: paramString(params, "status"),
    category: paramString(params, "category"),
    paymentMethod: paramString(params, "paymentMethod"),
    realtorId: paramString(params, "realtorId"),
    cityId: paramString(params, "cityId"),
    from: paramString(params, "from"),
    to: paramString(params, "to"),
  }
  const tab = paramString(params, "tab") ?? "geral"
  const currentYear = new Date().getFullYear()

  const session = await auth()

  const [
    entries,
    allEntries,
    kpis,
    monthlySeries,
    expenseByCategory,
    incomeByRealtor,
    incomeByCity,
    topProperties,
    cashFlow,
    commissions,
    goals,
    proposals,
    cities,
    realtors,
    clients,
    properties,
    canManageFinancial,
  ] = await Promise.all([
    listAdminFinancialEntries(filters),
    listAdminFinancialEntries({}),
    getFinancialKpis(filters),
    getFinancialMonthlySeries(filters),
    getFinancialExpenseByCategory(filters),
    getFinancialIncomeByRealtor(filters),
    getFinancialIncomeByCity(filters),
    getFinancialTopProperties(filters),
    getFinancialCashFlowTimeline(filters),
    getFinancialCommissionsByRealtor(),
    listAdminGoals(currentYear),
    listAdminProposals({}),
    listCities(),
    listRealtors(),
    listAdminClients({}),
    listAdminProperties({ pageSize: 100 }),
    can(session?.user, "financial.manage"),
  ])

  const clientOptions = clients.map((c) => ({ id: c.id, name: c.name }))
  const realtorOptions = realtors.map((r) => ({ id: r.id, user: { name: r.user.name } }))
  const propertyOptions = properties.items.map((p) => ({ id: p.id, code: p.code, title: p.title }))

  const overdueCount = allEntries.filter(isEntryOverdue).length
  const availableBalance = allEntries.reduce((sum, entry) => {
    if (entry.status !== "PAID") return sum
    const amount = Number(entry.amount)
    return entry.type === "INCOME" ? sum + amount : sum - amount
  }, 0)
  const potentialCommission = proposals
    .filter((p) => p.status === "ACCEPTED" || p.status === "COMPLETED")
    .reduce((sum, p) => sum + (Number(p.commissionPercent ?? 0) / 100) * Number(p.value), 0)
  const goalsHit = goals.filter((g) => g.realized >= g.targetAmount).length

  if (allEntries.length === 0) {
    return (
      <div className="space-y-6">
        <DashboardSection index={0}>
          <div>
            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link href="/admin" className="hover:text-foreground">
                Visão Geral
              </Link>
              <ChevronRight className="size-3" />
              <span>Gestão Financeira</span>
            </div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Gestão Financeira</h1>
            <p className="text-sm text-muted-foreground">Centro financeiro inteligente — receitas, despesas e fluxo de caixa.</p>
          </div>
        </DashboardSection>
        <DashboardSection index={1}>
          <FinancialEmptyState clients={clientOptions} realtors={realtorOptions} properties={propertyOptions} />
        </DashboardSection>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DashboardSection index={0} className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/admin" className="hover:text-foreground">
              Visão Geral
            </Link>
            <ChevronRight className="size-3" />
            <span>Gestão Financeira</span>
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Gestão Financeira</h1>
          <p className="text-sm text-muted-foreground">Centro financeiro inteligente — receitas, despesas e fluxo de caixa.</p>
        </div>
        {canManageFinancial ? (
          <div className="flex flex-wrap items-center gap-2">
            <FinancialCreateButtons clients={clientOptions} realtors={realtorOptions} properties={propertyOptions} />
          </div>
        ) : null}
      </DashboardSection>

      <FinancialTabs tab={tab} className="gap-6">
        <DashboardSection index={1} className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
            <TabsTrigger value="comissoes">Comissões</TabsTrigger>
            <TabsTrigger value="metas">Metas</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>
          <div className="flex flex-wrap items-center gap-2">
            <FinancialSearch />
            <FinancialFiltersSheet cities={cities} realtors={realtorOptions} />
            <FinancialExportButton filters={filters as Record<string, string>} />
          </div>
        </DashboardSection>

        <TabsContent value="geral">
          <FinancialOverviewTab
            kpis={kpis}
            monthlySeries={monthlySeries}
            expenseByCategory={expenseByCategory}
            cashFlow={cashFlow}
            incomeByRealtor={incomeByRealtor}
            incomeByCity={incomeByCity}
            commissions={commissions}
            potentialCommission={potentialCommission}
            availableBalance={availableBalance}
            overdueCount={overdueCount}
            goalsHit={goalsHit}
          />
        </TabsContent>

        <TabsContent value="lancamentos">
          <DashboardSection index={2}>
            <FinancialDirectory
              entries={entries}
              clients={clientOptions}
              realtors={realtorOptions}
              properties={propertyOptions}
            />
          </DashboardSection>
        </TabsContent>

        <TabsContent value="comissoes">
          <DashboardSection index={2}>
            <FinancialCommissionsPanel commissions={commissions} />
          </DashboardSection>
        </TabsContent>

        <TabsContent value="metas">
          <DashboardSection index={2}>
            <GoalsPanel goals={goals} year={currentYear} realtors={realtorOptions} cities={cities} />
          </DashboardSection>
        </TabsContent>

        <TabsContent value="relatorios">
          <DashboardSection index={2}>
            <FinancialReportsPanel
              incomeByRealtor={incomeByRealtor}
              incomeByCity={incomeByCity}
              topProperties={topProperties}
              commissions={commissions}
              expenseByCategory={expenseByCategory}
              kpis={kpis}
            />
          </DashboardSection>
        </TabsContent>
      </FinancialTabs>
    </div>
  )
}
