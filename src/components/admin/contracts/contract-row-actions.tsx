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
import { updateContractStatus, deleteContract } from "@/modules/contract/actions"
import type { ContractStatus } from "@/generated/prisma/client"

// Qualquer status pode ir pra qualquer outro — inclusive voltar atrás
// (ex: Concluído → Ativo, se marcou errado).
const ALL_OPTIONS: { status: ContractStatus; label: string }[] = [
  { status: "DRAFT", label: "Voltar para rascunho" },
  { status: "ACTIVE", label: "Marcar como assinado/ativo" },
  { status: "COMPLETED", label: "Marcar como concluído" },
  { status: "CANCELED", label: "Cancelar contrato" },
]

export function ContractRowActions({
  contractId,
  status,
  onDeleted,
  onStatusChanged,
}: {
  contractId: string
  status: ContractStatus
  // Passado pelo painel de detalhes pra fechar o Sheet junto — na
  // listagem (linha da tabela) fica undefined, só o router.refresh()
  // já resolve.
  onDeleted?: () => void
  onStatusChanged?: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleChange(nextStatus: ContractStatus) {
    startTransition(async () => {
      try {
        await updateContractStatus(contractId, nextStatus)
        toast.success("Status atualizado.")
        onStatusChanged?.()
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao atualizar.")
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteContract(contractId)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success("Contrato excluído.")
      onDeleted?.()
      router.refresh()
    })
  }

  const options = ALL_OPTIONS.filter((option) => option.status !== status)

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isPending} onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          {options.map((option) => (
            <DropdownMenuItem key={option.status} onClick={() => handleChange(option.status)}>
              {option.label}
            </DropdownMenuItem>
          ))}
          {options.length > 0 ? <DropdownMenuSeparator /> : null}
          <AlertDialogTrigger asChild>
            <DropdownMenuItem variant="destructive" onSelect={(e) => e.preventDefault()}>
              Excluir
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir este contrato?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. Só é possível excluir um contrato sem lançamento financeiro
            vinculado — se já tiver comissão ou pagamento lançado, desvincule ou exclua esses lançamentos
            primeiro.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel />
          <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
