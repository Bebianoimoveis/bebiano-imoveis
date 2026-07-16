import { Building2 } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { Pagination } from "@/components/shared/pagination"
import { PropertyCard } from "@/components/public/property-card"
import { PropertyFiltersSidebar } from "@/components/public/property-filters-sidebar"
import { listPublicProperties } from "@/modules/property/actions"
import { listCities, listPropertyTypes } from "@/modules/taxonomy/actions"

const PAGE_SIZE = 20

type SearchParams = Record<string, string | string[] | undefined>

function param(searchParams: SearchParams, key: string) {
  const value = searchParams[key]
  return typeof value === "string" ? value : undefined
}

export async function PropertyListingPage({
  searchParams,
  fixedPurpose,
  title,
  basePath,
}: {
  searchParams: SearchParams
  fixedPurpose?: "SALE" | "RENT"
  title: string
  basePath: string
}) {
  const filters = {
    purpose: fixedPurpose ?? (param(searchParams, "purpose") as "SALE" | "RENT" | undefined),
    search: param(searchParams, "search"),
    code: param(searchParams, "code"),
    typeId: param(searchParams, "typeId"),
    cityId: param(searchParams, "cityId"),
    neighborhoodId: param(searchParams, "neighborhoodId"),
    minPrice: param(searchParams, "minPrice"),
    maxPrice: param(searchParams, "maxPrice"),
    bedrooms: param(searchParams, "bedrooms"),
    minArea: param(searchParams, "minArea"),
    acceptsFinancing: param(searchParams, "acceptsFinancing"),
    acceptsFgts: param(searchParams, "acceptsFgts"),
    furnished: param(searchParams, "furnished"),
    gatedCommunity: param(searchParams, "gatedCommunity"),
    page: param(searchParams, "page") ? Number(param(searchParams, "page")) : 1,
  }

  const [{ items, total }, cities, propertyTypes] = await Promise.all([
    listPublicProperties(filters),
    listCities(),
    listPropertyTypes(),
  ])

  function buildHref(page: number) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value === "string" && key !== "page") params.set(key, value)
    }
    if (page > 1) params.set("page", String(page))
    const query = params.toString()
    return query ? `${basePath}?${query}` : basePath
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 font-heading text-2xl font-semibold tracking-tight">
        {title}
      </h1>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <PropertyFiltersSidebar cities={cities} propertyTypes={propertyTypes} />

        <div className="space-y-6">
          {items.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Nenhum imóvel encontrado"
              description="Tente ajustar os filtros de busca."
            />
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {total} {total === 1 ? "imóvel encontrado" : "imóveis encontrados"}
              </p>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
              <Pagination
                page={filters.page}
                pageSize={PAGE_SIZE}
                total={total}
                buildHref={buildHref}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
