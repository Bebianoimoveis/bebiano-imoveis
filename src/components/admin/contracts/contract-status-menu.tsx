"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronDown, Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ContractStatusBadge, CONTRACT_STATUS_LABELS } from "@/components/admin/contracts/contract-status-badge"
import { updateContractStatus } from "@/modules/contract/actions"
import type { ContractStatus } from "@/generated/prisma/client"

const ORDER: ContractStatus[] = ["DRAFT", "ACTIVE", "COMPLETED", "CANCELED"]

// Selo do status clicável: abre a lista com todos os status e permite
// trocar pra qualquer um (inclusive voltar atrás, ex: Concluído → Ativo
// se marcou errado). Sem permissão de gerenciar, vira só o selo.
export function ContractStatusMenu({
  contractId,
  status,
  canManage = true,
  onChanged,
}: {
  contractId: string
  status: ContractStatus
  canManage?: boolean
  onChanged?: (status: ContractStatus) => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (!canManage) return <ContractStatusBadge status={status} />

  function handleChange(next: ContractStatus) {
    if (next === status) return
    startTransition(async () => {
      try {
        await updateContractStatus(contractId, next)
        toast.success(`Status alterado para ${CONTRACT_STATUS_LABELS[next]}.`)
        onChanged?.(next)
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao atualizar o status.")
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={isPending}
          onClick={(e) => e.stopPropagation()}
          title="Alterar status"
          className="inline-flex items-center gap-1 rounded-full transition-opacity hover:opacity-80 disabled:opacity-60"
        >
          <ContractStatusBadge status={status} />
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
          ) : (
            <ChevronDown className="size-3.5 text-muted-foreground" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel className="text-xs text-muted-foreground">Alterar status</DropdownMenuLabel>
        {ORDER.map((option) => (
          <DropdownMenuItem key={option} onClick={() => handleChange(option)} className="gap-2">
            <Check className={option === status ? "size-4" : "size-4 opacity-0"} />
            {CONTRACT_STATUS_LABELS[option]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
