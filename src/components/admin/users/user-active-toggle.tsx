"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { setUserActive } from "@/modules/user/actions"

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
        toast.error(error instanceof Error ? error.message : "Erro ao atualizar.")
      }
    })
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleClick} disabled={isPending}>
      {active ? "Desativar" : "Ativar"}
    </Button>
  )
}
