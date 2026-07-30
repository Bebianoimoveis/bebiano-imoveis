"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AppointmentFormSheet } from "@/components/admin/agenda/appointment-form-sheet"

type RealtorOption = { id: string; user: { name: string } }

export function AppointmentCreateButton({ realtors }: { realtors: RealtorOption[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Novo Compromisso
      </Button>
      <AppointmentFormSheet open={open} onOpenChange={setOpen} realtors={realtors} />
    </>
  )
}
