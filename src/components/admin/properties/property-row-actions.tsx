"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Archive,
  Copy,
  Eye,
  EyeOff,
  MoreHorizontal,
  Pencil,
  Share2,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Button } from "@/components/ui/button"
import {
  archiveProperty,
  changePropertyStatus,
  duplicateProperty,
} from "@/modules/property/actions"
import { siteConfig } from "@/config/site"
import type { PropertyStatus } from "@/generated/prisma/client"

type PropertyRowActionsProps = {
  propertyId: string
  status: PropertyStatus
  slug: string
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

export function PropertyRowActions({ propertyId, status, slug }: PropertyRowActionsProps) {
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
  const publicUrl = `${siteConfig.url}/imoveis/${slug}`

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isPending}>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => router.push(`/admin/imoveis/${propertyId}`)}>
            <Pencil /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <Eye /> Visualizar no site
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              navigator.clipboard.writeText(publicUrl)
              toast.success("Link copiado.")
            }}
          >
            <Share2 /> Compartilhar
          </DropdownMenuItem>

          <DropdownMenuSeparator />

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
              {option.status === "DRAFT" ? <EyeOff /> : <Sparkles />}
              {option.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem
            onClick={() => runAction(() => duplicateProperty(propertyId), "Imóvel duplicado.")}
          >
            <Copy /> Duplicar
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <AlertDialogTrigger asChild>
            <DropdownMenuItem variant="destructive" onSelect={(e) => e.preventDefault()}>
              <Archive /> Arquivar
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Arquivar este imóvel?</AlertDialogTitle>
          <AlertDialogDescription>
            O imóvel sai do site e da listagem ativa. Você pode encontrá-lo depois filtrando por
            status &ldquo;Arquivado&rdquo;, mas essa ação não pode ser desfeita por aqui.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel />
          <AlertDialogAction
            onClick={() => runAction(() => archiveProperty(propertyId), "Imóvel arquivado.")}
          >
            Arquivar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
