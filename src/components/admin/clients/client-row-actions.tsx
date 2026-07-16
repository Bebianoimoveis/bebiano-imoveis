"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal } from "lucide-react"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ClientFormDialog } from "@/components/admin/clients/client-form-dialog"
import { archiveClient } from "@/modules/client/actions"
import type { ClientInput } from "@/modules/client/schema"

export function ClientRowActions({
  clientId,
  defaultValues,
}: {
  clientId: string
  defaultValues: ClientInput
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleArchive() {
    startTransition(async () => {
      try {
        await archiveClient(clientId)
        toast.success("Cliente arquivado.")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao arquivar.")
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isPending}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <ClientFormDialog
          mode="edit"
          clientId={clientId}
          defaultValues={defaultValues}
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              Editar
            </DropdownMenuItem>
          }
        />
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleArchive}>
          Arquivar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
