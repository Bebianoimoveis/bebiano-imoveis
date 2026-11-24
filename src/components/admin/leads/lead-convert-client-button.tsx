"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { convertLeadToClient } from "@/modules/lead/actions"
import { actionErrorMessage } from "@/lib/action-error"

export function LeadConvertClientButton({ leadId }: { leadId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      try {
        await convertLeadToClient(leadId)
        toast.success("Lead convertido em cliente.")
        router.refresh()
      } catch (error) {
        toast.error(actionErrorMessage(error, "Erro ao converter lead."))
      }
    })
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
      {isPending ? "Convertendo..." : "Converter em cliente"}
    </Button>
  )
}
