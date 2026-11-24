"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { setUserActive } from "@/modules/user/actions"
import { actionErrorMessage } from "@/lib/action-error"

export function UserActiveToggle({
  userId,
  active,
}: {
  userId: string
  active: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      try {
        await setUserActive(userId, !active)
        toast.success(active ? "Usuário desativado." : "Usuário ativado.")
        router.refresh()
      } catch (error) {
        toast.error(actionErrorMessage(error, "Erro ao atualizar."))
      }
    })
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleClick} disabled={isPending}>
      {active ? "Desativar" : "Ativar"}
    </Button>
  )
}
