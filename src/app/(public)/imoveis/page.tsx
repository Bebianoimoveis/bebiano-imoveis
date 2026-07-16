import type { Metadata } from "next"

import { PropertyListingPage } from "@/components/public/property-listing-page"

export const metadata: Metadata = {
  title: "Imóveis",
  description: "Todos os imóveis disponíveis para compra e locação.",
}

type SearchParams = Record<string, string | string[] | undefined>

export default async function ImoveisPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  return (
    <PropertyListingPage
      searchParams={await searchParams}
      title="Todos os imóveis"
      basePath="/imoveis"
    />
  )
}
