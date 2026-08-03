"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { toggleSegmentActive } from "@/modules/segment/actions"
import { cn } from "@/lib/utils"

export function SegmentActiveToggle({ id, active }: { id: string; active: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      try {
        await toggleSegmentActive(id, !active)
        toast.success(!active ? "Segmento ativado — visível na home." : "Segmento desativado — banner escondido.")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao atualizar segmento.")
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
      <span
        className={cn(
          "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
          active ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </button>
  )
}
