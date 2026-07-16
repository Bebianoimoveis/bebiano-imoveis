import type { Metadata } from "next"

import { PropertyListingPage } from "@/components/public/property-listing-page"

export const metadata: Metadata = {
  title: "Comprar imóveis",
  description: "Imóveis à venda em Mogi das Cruzes e região.",
}

type SearchParams = Record<string, string | string[] | undefined>

export default async function ComprarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  return (
    <PropertyListingPage
      searchParams={await searchParams}
      fixedPurpose="SALE"
      title="Imóveis à venda"
      basePath="/comprar"
    />
  )
}
