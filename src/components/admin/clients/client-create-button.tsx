"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ClientCreateSheet } from "@/components/admin/clients/client-create-sheet"

type RealtorOption = { id: string; user: { name: string } }
type CityOption = { id: string; name: string; state: string }

export function ClientCreateButton({
  realtors,
  cities,
  trigger,
}: {
  realtors: RealtorOption[]
  cities: CityOption[]
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)}>{trigger}</span>
      ) : (
        <Button className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Novo Cliente
        </Button>
      )}
      <ClientCreateSheet open={open} onOpenChange={setOpen} realtors={realtors} cities={cities} />
    </>
  )
}
