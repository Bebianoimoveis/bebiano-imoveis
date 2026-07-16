"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal } from "lucide-react"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { updateContractStatus } from "@/modules/contract/actions"
import type { ContractStatus } from "@/generated/prisma/client"

const OPTIONS: Partial<Record<ContractStatus, { status: ContractStatus; label: string }[]>> = {
  DRAFT: [
    { status: "ACTIVE", label: "Marcar como assinado/ativo" },
    { status: "CANCELED", label: "Cancelar" },
  ],
  ACTIVE: [
    { status: "COMPLETED", label: "Marcar como concluído" },
    { status: "CANCELED", label: "Cancelar" },
  ],
}

export function ContractRowActions({
  contractId,
  status,
}: {
  contractId: string
  status: ContractStatus
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleChange(nextStatus: ContractStatus) {
    startTransition(async () => {
      try {
        await updateContractStatus(contractId, nextStatus)
        toast.success("Status atualizado.")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao atualizar.")
      }
    })
  }

  const options = OPTIONS[status] ?? []
  if (options.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isPending}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((option) => (
          <DropdownMenuItem key={option.status} onClick={() => handleChange(option.status)}>
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
