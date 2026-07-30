"use client"

import { useState } from "react"

import { ProposalWizardSheet } from "@/components/admin/proposals/proposal-wizard-sheet"

type RealtorOption = { id: string; user: { name: string } }
type ClientOption = { id: string; name: string }

type ProposalFormDialogProps = {
  trigger: React.ReactNode
  realtors: RealtorOption[]
  clients?: ClientOption[]
  leadId?: string
  fixedPropertyId?: string
  fixedPropertyLabel?: string
  fixedClientId?: string
}

// Trigger auto-contido — mantém a mesma API usada pelos painéis de Lead
// e Cliente, agora abrindo o Wizard de 5 passos em vez do formulário de
// um passo só.
export function ProposalFormDialog({
  trigger,
  realtors,
  clients,
  leadId,
  fixedPropertyId,
  fixedPropertyLabel,
  fixedClientId,
}: ProposalFormDialogProps) {
  const [open, setOpen] = useState(false)
  const fixedClientLabel = fixedClientId ? clients?.find((c) => c.id === fixedClientId)?.name : undefined

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <ProposalWizardSheet
        open={open}
        onOpenChange={setOpen}
        realtors={realtors}
        leadId={leadId}
        fixedClientId={fixedClientId}
        fixedClientLabel={fixedClientLabel}
        fixedPropertyId={fixedPropertyId}
        fixedPropertyLabel={fixedPropertyLabel}
      />
    </>
  )
}
