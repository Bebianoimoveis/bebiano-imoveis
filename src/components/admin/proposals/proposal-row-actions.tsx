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
import { updateProposalStatus } from "@/modules/proposal/actions"
import { generateContractFromProposal } from "@/modules/contract/actions"
import type { ProposalStatus } from "@/generated/prisma/client"

export function ProposalRowActions({
  proposalId,
  status,
  hasContract,
}: {
  proposalId: string
  status: ProposalStatus
  hasContract: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleStatusChange(nextStatus: ProposalStatus) {
    startTransition(async () => {
      try {
        await updateProposalStatus(proposalId, nextStatus)
        toast.success("Status atualizado.")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao atualizar.")
      }
    })
  }

  function handleGenerateContract() {
    startTransition(async () => {
      try {
        await generateContractFromProposal(proposalId)
        toast.success("Contrato gerado.")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao gerar contrato.")
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
        {status === "OPEN" ? (
          <>
            <DropdownMenuItem onClick={() => handleStatusChange("ACCEPTED")}>
              Aceitar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange("REJECTED")}>
              Recusar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange("CANCELED")}>
              Cancelar
            </DropdownMenuItem>
          </>
        ) : null}
        {status === "ACCEPTED" && !hasContract ? (
          <DropdownMenuItem onClick={handleGenerateContract}>
            Gerar contrato
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
