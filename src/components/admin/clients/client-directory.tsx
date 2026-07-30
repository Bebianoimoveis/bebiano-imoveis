"use client"

import { useState } from "react"

import { ClientListView } from "@/components/admin/clients/client-list-view"
import { ClientCardsView } from "@/components/admin/clients/client-cards-view"
import { ClientDetailPanel } from "@/components/admin/clients/client-detail-panel"
import type { ClientListItem } from "@/modules/client/repository"

type RealtorOption = { id: string; user: { name: string } }
type CityOption = { id: string; name: string; state: string }
type PropertyTypeOption = { id: string; name: string }

export function ClientDirectory({
  clients,
  view,
  realtors,
  cities,
  propertyTypes,
}: {
  clients: ClientListItem[]
  view: "list" | "cards"
  realtors: RealtorOption[]
  cities: CityOption[]
  propertyTypes: PropertyTypeOption[]
}) {
  const [openClientId, setOpenClientId] = useState<string | null>(null)

  return (
    <>
      {view === "list" ? (
        <ClientListView clients={clients} onOpenClient={setOpenClientId} />
      ) : (
        <ClientCardsView clients={clients} onOpenClient={setOpenClientId} />
      )}

      <ClientDetailPanel
        clientId={openClientId}
        onClose={() => setOpenClientId(null)}
        realtors={realtors}
        cities={cities}
        propertyTypes={propertyTypes}
      />
    </>
  )
}
