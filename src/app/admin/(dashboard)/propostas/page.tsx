import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { DashboardSection } from "@/components/admin/dashboard/dashboard-section"
import { ProposalKpis } from "@/components/admin/proposals/proposal-kpis"
import { ProposalSearch } from "@/components/admin/proposals/proposal-search"
import { ProposalFiltersSheet } from "@/components/admin/proposals/proposal-filters-sheet"
import { ProposalExportButton } from "@/components/admin/proposals/proposal-export-button"
import { ProposalCreateButton } from "@/components/admin/proposals/proposal-create-button"
import { ProposalViewToggle } from "@/components/admin/proposals/proposal-view-toggle"
import { ProposalDirectory } from "@/components/admin/proposals/proposal-directory"
import { ProposalEmptyState } from "@/components/admin/proposals/proposal-empty-state"
import { getProposalCrmStats, listAdminProposals } from "@/modules/proposal/actions"
import { listCities } from "@/modules/taxonomy/actions"
import { listRealtors } from "@/modules/realtor/actions"

type SearchParams = Record<string, string | string[] | undefined>

function paramString(params: SearchParams, key: string) {
  const value = params[key]
  return typeof value === "string" ? value : undefined
}

export default async function AdminProposalsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const filters = {
    search: paramString(params, "search"),
    status: paramString(params, "status"),
    realtorId: paramString(params, "realtorId"),
    cityId: paramString(params, "cityId"),
    minValue: paramString(params, "minValue"),
    maxValue: paramString(params, "maxValue"),
    createdFrom: paramString(params, "createdFrom"),
    createdTo: paramString(params, "createdTo"),
  }
  const view = paramString(params, "view") === "pipeline" ? "pipeline" : "table"

  const [proposals, stats, cities, realtors] = await Promise.all([
    listAdminProposals(filters),
    getProposalCrmStats(filters),
    listCities(),
    listRealtors(),
  ])

  function buildHref(overrides: { view?: "table" | "pipeline" }) {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") search.set(key, value)
    }
    if (overrides.view) search.set("view", overrides.view)
    const query = search.toString()
    return query ? `/admin/propostas?${query}` : "/admin/propostas"
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
            <span>Propostas</span>
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Propostas</h1>
          <p className="text-sm text-muted-foreground">
            Centro de negociação — acompanhe cada proposta do primeiro contato até a venda concluída.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ProposalExportButton />
          <ProposalCreateButton realtors={realtors} />
        </div>
      </DashboardSection>

      <DashboardSection index={1}>
        <ProposalKpis stats={stats} />
      </DashboardSection>

      <DashboardSection index={2} className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <ProposalSearch />
          <ProposalFiltersSheet cities={cities} realtors={realtors} />
        </div>
        <ProposalViewToggle view={view} buildHref={(v) => buildHref({ view: v })} />
      </DashboardSection>

      <DashboardSection index={3}>
        {proposals.length === 0 ? (
          <ProposalEmptyState realtors={realtors} />
        ) : (
          <ProposalDirectory proposals={proposals} view={view} realtors={realtors} />
        )}
      </DashboardSection>
    </div>
  )
}
