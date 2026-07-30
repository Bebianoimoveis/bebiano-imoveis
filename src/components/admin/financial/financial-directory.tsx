"use client"

import { useState } from "react"

import { FinancialTableView } from "@/components/admin/financial/financial-table-view"
import { FinancialCardsView } from "@/components/admin/financial/financial-cards-view"
import { FinancialListView } from "@/components/admin/financial/financial-list-view"
import { FinancialEntryDetailPanel } from "@/components/admin/financial/financial-entry-detail-panel"
import { FinancialEntryFormSheet } from "@/components/admin/financial/financial-entry-form-sheet"
import type { FinancialEntryListItem } from "@/modules/financial/repository"

type ClientOption = { id: string; name: string }
type RealtorOption = { id: string; user: { name: string } }
type PropertyOption = { id: string; code: string; title: string }

export function FinancialDirectory({
  entries,
  clients,
  realtors,
  properties,
}: {
  entries: FinancialEntryListItem[]
  clients: ClientOption[]
  realtors: RealtorOption[]
  properties: PropertyOption[]
}) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<FinancialEntryListItem | null>(null)

  return (
    <>
      <div className="hidden lg:block">
        <FinancialTableView entries={entries} onOpen={setOpenId} onEdit={setEditingEntry} />
      </div>
      <div className="hidden md:block lg:hidden">
        <FinancialCardsView entries={entries} onOpen={setOpenId} onEdit={setEditingEntry} />
      </div>
      <div className="md:hidden">
        <FinancialListView entries={entries} onOpen={setOpenId} />
      </div>

      <FinancialEntryDetailPanel
        entryId={openId}
        onClose={() => setOpenId(null)}
        clients={clients}
        realtors={realtors}
        properties={properties}
      />

      <FinancialEntryFormSheet
        open={editingEntry !== null}
        onOpenChange={(open) => !open && setEditingEntry(null)}
        entry={editingEntry}
        clients={clients}
        realtors={realtors}
        properties={properties}
      />
    </>
  )
}
