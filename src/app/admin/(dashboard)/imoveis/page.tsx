import Link from "next/link"
import { Building2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { Pagination } from "@/components/shared/pagination"
import { PropertyFilters } from "@/components/admin/properties/property-filters"
import { PropertyTable } from "@/components/admin/properties/property-table"
import { listAdminProperties } from "@/modules/property/actions"
import { listCities } from "@/modules/taxonomy/actions"

const PAGE_SIZE = 20

type SearchParams = Record<string, string | string[] | undefined>

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const filters = {
    search: typeof params.search === "string" ? params.search : undefined,
    purpose: typeof params.purpose === "string" ? params.purpose : undefined,
    status: typeof params.status === "string" ? params.status : undefined,
    cityId: typeof params.cityId === "string" ? params.cityId : undefined,
    page: typeof params.page === "string" ? Number(params.page) : 1,
  }

  const [{ items, total }, cities] = await Promise.all([
    listAdminProperties(filters),
    listCities(),
  ])

  function buildHref(page: number) {
    const search = new URLSearchParams()
    if (filters.search) search.set("search", filters.search)
    if (filters.purpose) search.set("purpose", filters.purpose)
    if (filters.status) search.set("status", filters.status)
    if (filters.cityId) search.set("cityId", filters.cityId)
    if (page > 1) search.set("page", String(page))
    const query = search.toString()
    return query ? `/admin/imoveis?${query}` : "/admin/imoveis"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Imóveis
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie o catálogo de imóveis da imobiliária.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/imoveis/novo">
            <Plus className="size-4" />
            Novo imóvel
          </Link>
        </Button>
      </div>

      <PropertyFilters cities={cities} />

      {items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhum imóvel encontrado"
          description="Ajuste os filtros ou cadastre o primeiro imóvel da imobiliária."
          action={
            <Button asChild size="sm">
              <Link href="/admin/imoveis/novo">Cadastrar imóvel</Link>
            </Button>
          }
        />
      ) : (
        <>
          <PropertyTable properties={items} />
          <Pagination
            page={filters.page}
            pageSize={PAGE_SIZE}
            total={total}
            buildHref={buildHref}
          />
        </>
      )}
    </div>
  )
}
