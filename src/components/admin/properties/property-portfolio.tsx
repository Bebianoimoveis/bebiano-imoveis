"use client"

import { useState } from "react"

import { PropertyListView } from "@/components/admin/properties/property-list-view"
import { PropertyGridView } from "@/components/admin/properties/property-grid-view"
import { PropertyBulkToolbar } from "@/components/admin/properties/property-bulk-toolbar"
import type { PropertyWithMetrics } from "@/components/admin/properties/types"

type RealtorOption = { id: string; user: { name: string } }

export function PropertyPortfolio({
  properties,
  view,
  realtors,
}: {
  properties: PropertyWithMetrics[]
  view: "list" | "grid"
  realtors: RealtorOption[]
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelectedIds((prev) =>
      prev.size === properties.length ? new Set() : new Set(properties.map((p) => p.id))
    )
  }

  return (
    <>
      {view === "grid" ? (
        <PropertyGridView properties={properties} selectedIds={selectedIds} onToggle={toggle} />
      ) : (
        <PropertyListView
          properties={properties}
          selectedIds={selectedIds}
          onToggle={toggle}
          onToggleAll={toggleAll}
        />
      )}

      <PropertyBulkToolbar
        selectedIds={[...selectedIds]}
        realtors={realtors}
        onClear={() => setSelectedIds(new Set())}
      />
    </>
  )
}
