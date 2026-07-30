"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Archive, Eye, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { deleteClient } from "@/modules/client/actions"

export function ClientRowActions({ clientId, onOpen }: { clientId: string; onOpen: () => void }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleArchive() {
    startTransition(async () => {
      try {
        await deleteClient(clientId)
        toast.success("Cliente arquivado.")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao arquivar.")
      }
    })
  }

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isPending} onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={onOpen}>
            <Eye /> Ver perfil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialogTrigger asChild>
            <DropdownMenuItem variant="destructive" onSelect={(e) => e.preventDefault()}>
              <Archive /> Arquivar
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Arquivar este cliente?</AlertDialogTitle>
          <AlertDialogDescription>
            Ele sai da listagem ativa. Leads, propostas e contratos vinculados continuam guardados,
            mas o cliente não aparece mais nas buscas do CRM.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel />
          <AlertDialogAction onClick={handleArchive}>Arquivar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
