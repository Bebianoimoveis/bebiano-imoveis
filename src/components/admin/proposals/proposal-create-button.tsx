"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProposalWizardSheet } from "@/components/admin/proposals/proposal-wizard-sheet"

type RealtorOption = { id: string; user: { name: string } }

export function ProposalCreateButton({ realtors }: { realtors: RealtorOption[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Nova Proposta
      </Button>
      <ProposalWizardSheet open={open} onOpenChange={setOpen} realtors={realtors} />
    </>
  )
}
