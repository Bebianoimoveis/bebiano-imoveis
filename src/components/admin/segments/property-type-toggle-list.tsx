"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { PropertyTypeFormDialog } from "@/components/admin/taxonomy/property-type-form-dialog"
import { togglePropertyTypeActive, deletePropertyType } from "@/modules/taxonomy/actions"
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

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deletePropertyType(id)
        toast.success("Tipo de imóvel excluído.")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao excluir tipo de imóvel.")
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
            <div className="flex items-center gap-3">
              <PropertyTypeFormDialog
                mode="edit"
                propertyTypeId={type.id}
                defaultName={type.name}
                trigger={
                  <Button variant="ghost" size="sm" disabled={isPending}>
                    Editar
                  </Button>
                }
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir o tipo &ldquo;{type.name}&rdquo;?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Essa ação não pode ser desfeita. Só é possível excluir um tipo sem imóvel,
                      segmento, preferência de cliente ou captação vinculados — se já tiver uso,
                      prefira desativar.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel />
                    <AlertDialogAction onClick={() => handleDelete(type.id)}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
                  className="absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left]"
                  style={{ left: type.active ? 22 : 2 }}
                />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
