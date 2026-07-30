"use client"

import { useState } from "react"
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FinancialEntryFormSheet } from "@/components/admin/financial/financial-entry-form-sheet"

type ClientOption = { id: string; name: string }
type RealtorOption = { id: string; user: { name: string } }
type PropertyOption = { id: string; code: string; title: string }

export function FinancialCreateButtons({
  clients,
  realtors,
  properties,
}: {
  clients: ClientOption[]
  realtors: RealtorOption[]
  properties: PropertyOption[]
}) {
  const [type, setType] = useState<"INCOME" | "EXPENSE" | null>(null)

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" className="gap-1.5" onClick={() => setType("INCOME")}>
          <ArrowUpCircle className="size-4" />
          Nova Receita
        </Button>
        <Button className="gap-1.5" onClick={() => setType("EXPENSE")}>
          <ArrowDownCircle className="size-4" />
          Nova Despesa
        </Button>
      </div>

      <FinancialEntryFormSheet
        open={type !== null}
        onOpenChange={(open) => !open && setType(null)}
        defaultType={type ?? "INCOME"}
        clients={clients}
        realtors={realtors}
        properties={properties}
      />
    </>
  )
}
