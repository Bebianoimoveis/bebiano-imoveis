import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { DashboardSection } from "@/components/admin/dashboard/dashboard-section"
import { LeadKpis } from "@/components/admin/leads/lead-kpis"
import { LeadSearch } from "@/components/admin/leads/lead-search"
import { LeadFiltersSheet } from "@/components/admin/leads/lead-filters-sheet"
import { LeadExportButton } from "@/components/admin/leads/lead-export-button"
import { LeadCreateButton } from "@/components/admin/leads/lead-create-button"
import { LeadShortcutsHelp } from "@/components/admin/leads/lead-shortcuts-help"
import { LeadCrmBoard } from "@/components/admin/leads/lead-crm-board"
import { getLeadCrmStats, listAdminLeads } from "@/modules/lead/actions"
import { listCities } from "@/modules/taxonomy/actions"
import { listRealtors } from "@/modules/realtor/actions"

type SearchParams = Record<string, string | string[] | undefined>

function paramString(params: SearchParams, key: string) {
  const value = params[key]
  return typeof value === "string" ? value : undefined
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const filters = {
    search: paramString(params, "search"),
    stage: paramString(params, "stage"),
    origin: paramString(params, "origin"),
    temperature: paramString(params, "temperature"),
    realtorId: paramString(params, "realtorId"),
    cityId: paramString(params, "cityId"),
    minValue: paramString(params, "minValue"),
    maxValue: paramString(params, "maxValue"),
    createdFrom: paramString(params, "createdFrom"),
    createdTo: paramString(params, "createdTo"),
    lastInteractionFrom: paramString(params, "lastInteractionFrom"),
    lastInteractionTo: paramString(params, "lastInteractionTo"),
  }

  const [leads, stats, cities, realtors] = await Promise.all([
    listAdminLeads(filters),
    getLeadCrmStats(filters),
    listCities(),
    listRealtors(),
  ])

  return (
    <div className="space-y-6">
      <DashboardSection index={0} className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/admin" className="hover:text-foreground">
              Visão Geral
            </Link>
            <ChevronRight className="size-3" />
            <span>Central de Leads</span>
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Central de Leads
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe e trabalhe o funil de atendimento do CRM.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LeadShortcutsHelp />
          <LeadExportButton />
          <LeadCreateButton realtors={realtors} />
        </div>
      </DashboardSection>

      <DashboardSection index={1}>
        <LeadKpis stats={stats} />
      </DashboardSection>

      <DashboardSection index={2} className="flex flex-wrap items-center gap-3">
        <LeadSearch />
        <LeadFiltersSheet cities={cities} realtors={realtors} />
      </DashboardSection>

      <DashboardSection index={3}>
        <LeadCrmBoard leads={leads} realtors={realtors} />
      </DashboardSection>
    </div>
  )
}
