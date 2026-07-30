"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Copy, Eye, MoreHorizontal, Pencil, Trash2, CheckCircle2 } from "lucide-react"
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
import { duplicateFinancialEntry, deleteFinancialEntry, markFinancialEntryStatus } from "@/modules/financial/actions"
import type { FinancialEntryListItem } from "@/modules/financial/repository"

export function FinancialEntryRowActions({
  entry,
  onOpen,
  onEdit,
}: {
  entry: FinancialEntryListItem
  onOpen: () => void
  onEdit: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function runAction(action: () => Promise<unknown>, message: string) {
    startTransition(async () => {
      try {
        await action()
        toast.success(message)
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro inesperado.")
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
            <Eye /> Ver detalhes
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit}>
            <Pencil /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => runAction(() => duplicateFinancialEntry(entry.id), "Lançamento duplicado.")}>
            <Copy /> Duplicar
          </DropdownMenuItem>
          {entry.status !== "PAID" && entry.status !== "CANCELED" ? (
            <DropdownMenuItem
              onClick={() =>
                runAction(
                  () => markFinancialEntryStatus(entry.id, "PAID"),
                  entry.type === "INCOME" ? "Marcado como recebido." : "Marcado como pago."
                )
              }
            >
              <CheckCircle2 /> {entry.type === "INCOME" ? "Marcar como recebido" : "Marcar como pago"}
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuSeparator />

          <AlertDialogTrigger asChild>
            <DropdownMenuItem variant="destructive" onSelect={(e) => e.preventDefault()}>
              <Trash2 /> Excluir
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir este lançamento?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. Se o lançamento só não vai mais acontecer, prefira cancelá-lo em vez de excluir.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel />
          <AlertDialogAction onClick={() => runAction(() => deleteFinancialEntry(entry.id), "Lançamento excluído.")}>
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
