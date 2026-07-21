"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal } from "lucide-react"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  archiveProperty,
  changePropertyStatus,
  duplicateProperty,
} from "@/modules/property/actions"
import type { PropertyStatus } from "@/generated/prisma/client"

type PropertyRowActionsProps = {
  propertyId: string
  status: PropertyStatus
}

const NEXT_STATUS_OPTIONS: Partial<Record<PropertyStatus, { label: string; status: PropertyStatus }[]>> = {
  DRAFT: [{ label: "Publicar", status: "PUBLISHED" }],
  IN_REVIEW: [{ label: "Publicar", status: "PUBLISHED" }],
  PUBLISHED: [
    { label: "Marcar como reservado", status: "RESERVED" },
    { label: "Marcar como vendido", status: "SOLD" },
    { label: "Despublicar", status: "DRAFT" },
  ],
  RESERVED: [
    { label: "Voltar a publicado", status: "PUBLISHED" },
    { label: "Marcar como vendido", status: "SOLD" },
  ],
  UNAVAILABLE: [{ label: "Voltar a publicado", status: "PUBLISHED" }],
}

export function PropertyRowActions({ propertyId, status }: PropertyRowActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function runAction(action: () => Promise<unknown>, successMessage: string) {
    startTransition(async () => {
      try {
        await action()
        toast.success(successMessage)
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro inesperado.")
      }
    })
  }

  const statusOptions = NEXT_STATUS_OPTIONS[status] ?? []

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isPending}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/admin/imoveis/${propertyId}`)}>
          Editar
        </DropdownMenuItem>
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.status}
            onClick={() =>
              runAction(
                () => changePropertyStatus(propertyId, option.status),
                "Status atualizado."
              )
            }
          >
            {option.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          onClick={() =>
            runAction(() => duplicateProperty(propertyId), "Imóvel duplicado.")
          }
        >
          Duplicar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() =>
            runAction(() => archiveProperty(propertyId), "Imóvel arquivado.")
          }
        >
          Arquivar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
