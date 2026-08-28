import type { Metadata } from "next"

import { PropertyListingPage } from "@/components/public/property-listing-page"

export const metadata: Metadata = {
  title: "Alugar imóveis",
  description: "Imóveis para locação em Mogi das Cruzes e região.",
}

type SearchParams = Record<string, string | string[] | undefined>

export default async function AlugarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  return (
    <PropertyListingPage
      searchParams={await searchParams}
      fixedPurpose="RENT"
      titlePrefix="Imóveis para"
      titleAccent="alugar"
      basePath="/alugar"
    />
  )
}
