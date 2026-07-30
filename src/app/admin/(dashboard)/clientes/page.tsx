import Link from "next/link"
import { ChevronRight, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { DashboardSection } from "@/components/admin/dashboard/dashboard-section"
import { ClientKpis } from "@/components/admin/clients/client-kpis"
import { ClientSearch } from "@/components/admin/clients/client-search"
import { ClientFiltersSheet } from "@/components/admin/clients/client-filters-sheet"
import { ClientExportButton } from "@/components/admin/clients/client-export-button"
import { ClientCreateButton } from "@/components/admin/clients/client-create-button"
import { ClientViewToggle } from "@/components/admin/clients/client-view-toggle"
import { ClientDirectory } from "@/components/admin/clients/client-directory"
import { getClientCrmStats, listAdminClients } from "@/modules/client/actions"
import { listCities, listPropertyTypes } from "@/modules/taxonomy/actions"
import { listRealtors } from "@/modules/realtor/actions"

type SearchParams = Record<string, string | string[] | undefined>

function paramString(params: SearchParams, key: string) {
  const value = params[key]
  return typeof value === "string" ? value : undefined
}

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const filters = {
    search: paramString(params, "search"),
    cityId: paramString(params, "cityId"),
    state: paramString(params, "state"),
    type: paramString(params, "type"),
    origin: paramString(params, "origin"),
    realtorId: paramString(params, "realtorId"),
    status: paramString(params, "status"),
    vip: paramString(params, "vip"),
    createdFrom: paramString(params, "createdFrom"),
    createdTo: paramString(params, "createdTo"),
    lastInteractionFrom: paramString(params, "lastInteractionFrom"),
    lastInteractionTo: paramString(params, "lastInteractionTo"),
  }
  const view = paramString(params, "view") === "cards" ? "cards" : "list"

  const [clients, stats, cities, realtors, propertyTypes] = await Promise.all([
    listAdminClients(filters),
    getClientCrmStats(filters),
    listCities(),
    listRealtors(),
    listPropertyTypes(),
  ])

  function buildHref(overrides: { view?: "list" | "cards" }) {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") search.set(key, value)
    }
    if (overrides.view) search.set("view", overrides.view)
    const query = search.toString()
    return query ? `/admin/clientes?${query}` : "/admin/clientes"
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
            <span>Clientes</span>
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Perfil completo, histórico e relacionamento com cada cliente da imobiliária.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ClientExportButton />
          <ClientCreateButton realtors={realtors} cities={cities} />
        </div>
      </DashboardSection>

      <DashboardSection index={1}>
        <ClientKpis stats={stats} />
      </DashboardSection>

      <DashboardSection index={2} className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <ClientSearch />
          <ClientFiltersSheet cities={cities} realtors={realtors} />
        </div>
        <ClientViewToggle view={view} buildHref={(v) => buildHref({ view: v })} />
      </DashboardSection>

      <DashboardSection index={3}>
        {clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum cliente cadastrado"
            description="Clientes convertidos de leads ou cadastrados manualmente aparecem aqui."
            action={
              <ClientCreateButton
                realtors={realtors}
                cities={cities}
                trigger={<Button size="sm">Cadastrar primeiro cliente</Button>}
              />
            }
          />
        ) : (
          <ClientDirectory
            clients={clients}
            view={view}
            realtors={realtors}
            cities={cities}
            propertyTypes={propertyTypes}
          />
        )}
      </DashboardSection>
    </div>
  )
}
