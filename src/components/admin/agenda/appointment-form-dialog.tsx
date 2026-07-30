"use client"

import { useState } from "react"

import { AppointmentFormSheet } from "@/components/admin/agenda/appointment-form-sheet"

type RealtorOption = { id: string; user: { name: string } }

type AppointmentFormDialogProps = {
  trigger: React.ReactNode
  realtors: RealtorOption[]
  contextLabel?: string
  leadId?: string
  clientId?: string
  propertyId?: string
}

// Trigger auto-contido — mantém a mesma API usada pelos painéis de Lead
// e Cliente (que só abrem o formulário de criação num contexto fixo),
// agora reaproveitando o Sheet premium em vez do Dialog antigo.
export function AppointmentFormDialog({
  trigger,
  realtors,
  contextLabel,
  leadId,
  clientId,
  propertyId,
}: AppointmentFormDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <AppointmentFormSheet
        open={open}
        onOpenChange={setOpen}
        realtors={realtors}
        contextLabel={contextLabel}
        leadId={leadId}
        clientId={clientId}
        propertyId={propertyId}
      />
    </>
  )
}
