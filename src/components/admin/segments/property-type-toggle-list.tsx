"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { togglePropertyTypeActive } from "@/modules/taxonomy/actions"
import { cn } from "@/lib/utils"

type PropertyTypeItem = {
  id: string
  name: string
  active: boolean
}

export function PropertyTypeToggleList({ types }: { types: PropertyTypeItem[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleToggle(id: string, next: boolean) {
    startTransition(async () => {
      try {
        await togglePropertyTypeActive(id, next)
        toast.success(
          next
            ? "Tipo reativado — voltou a aparecer no site."
            : "Tipo desativado — escondido do site inteiro (busca, filtros e listagens)."
        )
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao atualizar tipo de imóvel.")
      }
    })
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <ul className="divide-y divide-border/60">
        {types.map((type) => (
          <li key={type.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="text-sm font-medium">{type.name}</p>
              <p className="text-xs text-muted-foreground">
                {type.active ? "Visível em todo o site público." : "Escondido do site (busca, filtros e listagens)."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={type.active}
              disabled={isPending}
              onClick={() => handleToggle(type.id, !type.active)}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60",
                type.active ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
                  type.active ? "translate-x-[22px]" : "translate-x-0.5"
                )}
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
