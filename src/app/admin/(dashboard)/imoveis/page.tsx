import Link from "next/link"
import { Building2, ChevronRight, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { DashboardSection } from "@/components/admin/dashboard/dashboard-section"
import { PropertyKpis } from "@/components/admin/properties/property-kpis"
import { PropertySearch } from "@/components/admin/properties/property-search"
import { PropertyFilters } from "@/components/admin/properties/property-filters"
import { PropertyFiltersSheet } from "@/components/admin/properties/property-filters-sheet"
import { PropertyViewToggle } from "@/components/admin/properties/property-view-toggle"
import { PropertyPortfolio } from "@/components/admin/properties/property-portfolio"
import { PropertyPagination } from "@/components/admin/properties/property-pagination"
import { PropertyHeaderActions } from "@/components/admin/properties/property-header-actions"
import { getPropertyPortfolioStats, listAdminProperties } from "@/modules/property/actions"
import { listCities, listPropertyTypes } from "@/modules/taxonomy/actions"
import { listRealtors } from "@/modules/realtor/actions"

type SearchParams = Record<string, string | string[] | undefined>

function paramString(params: SearchParams, key: string) {
  const value = params[key]
  return typeof value === "string" ? value : undefined
}

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const filters = {
    search: paramString(params, "search"),
    status: paramString(params, "status"),
    cityId: paramString(params, "cityId"),
    neighborhoodId: paramString(params, "neighborhoodId"),
    typeId: paramString(params, "typeId"),
    realtorId: paramString(params, "realtorId"),
    minPrice: paramString(params, "minPrice"),
    maxPrice: paramString(params, "maxPrice"),
    minArea: paramString(params, "minArea"),
    bedrooms: paramString(params, "bedrooms"),
    suites: paramString(params, "suites"),
    parkingSpots: paramString(params, "parkingSpots"),
    createdFrom: paramString(params, "createdFrom"),
    createdTo: paramString(params, "createdTo"),
    acceptsFinancing: paramString(params, "acceptsFinancing"),
    acceptsFgts: paramString(params, "acceptsFgts"),
    furnished: paramString(params, "furnished"),
    gatedCommunity: paramString(params, "gatedCommunity"),
    featured: paramString(params, "featured"),
    page: paramString(params, "page") ? Number(paramString(params, "page")) : 1,
    pageSize: paramString(params, "pageSize") ? Number(paramString(params, "pageSize")) : 20,
  }
  const view = paramString(params, "view") === "grid" ? "grid" : "list"

  const [{ items, total }, stats, cities, propertyTypes, realtors] = await Promise.all([
    listAdminProperties(filters),
    getPropertyPortfolioStats(filters),
    listCities(),
    listPropertyTypes(),
    listRealtors(),
  ])

  function buildHref(page: number, overrides?: { view?: "list" | "grid" }) {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string" && key !== "page") search.set(key, value)
    }
    if (overrides?.view) search.set("view", overrides.view)
    if (page > 1) search.set("page", String(page))
    const query = search.toString()
    return query ? `/admin/imoveis?${query}` : "/admin/imoveis"
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
            <span>Portfólio de Imóveis</span>
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Portfólio de Imóveis
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie o catálogo de imóveis da imobiliária.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PropertyHeaderActions />
          <Button asChild>
            <Link href="/admin/imoveis/novo">
              <Plus className="size-4" />
              Novo imóvel
            </Link>
          </Button>
        </div>
      </DashboardSection>

      <DashboardSection index={1}>
        <PropertyKpis stats={stats} />
      </DashboardSection>

      <DashboardSection index={2} className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <PropertySearch />
          <PropertyFilters cities={cities} />
          <PropertyFiltersSheet cities={cities} propertyTypes={propertyTypes} realtors={realtors} />
        </div>
        <PropertyViewToggle view={view} buildHref={(v) => buildHref(1, { view: v })} />
      </DashboardSection>

      <DashboardSection index={3}>
        {items.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Nenhum imóvel encontrado"
            description="Ajuste os filtros ou cadastre o primeiro imóvel da imobiliária."
            action={
              <Button asChild size="sm">
                <Link href="/admin/imoveis/novo">Cadastrar primeiro imóvel</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-6">
            <PropertyPortfolio properties={items} view={view} realtors={realtors} />
            <PropertyPagination page={filters.page} pageSize={filters.pageSize} total={total} />
          </div>
        )}
      </DashboardSection>
    </div>
  )
}
