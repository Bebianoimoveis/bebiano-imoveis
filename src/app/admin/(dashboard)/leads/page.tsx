import { Users2 } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { LeadFilters } from "@/components/admin/leads/lead-filters"
import { LeadKanban } from "@/components/admin/leads/lead-kanban"
import { LeadViewToggle } from "@/components/admin/leads/lead-view-toggle"
import { listAdminLeads } from "@/modules/lead/actions"

type SearchParams = Record<string, string | string[] | undefined>

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const leads = await listAdminLeads({
    search: typeof params.search === "string" ? params.search : undefined,
    stage: typeof params.stage === "string" ? params.stage : undefined,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Leads
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe o funil de atendimento do CRM.
          </p>
        </div>
        <LeadViewToggle active="kanban" />
      </div>

      <LeadFilters />

      {leads.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="Nenhum lead encontrado"
          description="Novos contatos enviados pelo site aparecem aqui automaticamente."
        />
      ) : (
        <LeadKanban leads={leads} />
      )}
    </div>
  )
}
