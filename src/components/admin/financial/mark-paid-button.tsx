"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { markFinancialEntryAsPaid } from "@/modules/financial/actions"

export function MarkPaidButton({ entryId }: { entryId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      try {
        await markFinancialEntryAsPaid(entryId)
        toast.success("Lançamento marcado como pago.")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao atualizar.")
      }
    })
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleClick} disabled={isPending}>
      Marcar como pago
    </Button>
  )
}
