"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { setRealtorActive } from "@/modules/realtor/actions"
import { cn } from "@/lib/utils"

export function RealtorActiveToggle({ id, active }: { id: string; active: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      try {
        await setRealtorActive(id, !active)
        toast.success(!active ? "Corretor ativado — visível no site." : "Corretor desativado — some da equipe pública.")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao atualizar corretor.")
      }
    })
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      disabled={isPending}
      onClick={handleToggle}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60",
        active ? "bg-primary" : "bg-muted"
      )}
    >
      {/* left em style inline (não classe Tailwind com colchetes) — a
          posição do "conhecido" depende só disso, sem depender de nenhuma
          geração de CSS que possa ficar desatualizada em cache. */}
      <span
        className="absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left]"
        style={{ left: active ? 22 : 2 }}
      />
    </button>
  )
}
