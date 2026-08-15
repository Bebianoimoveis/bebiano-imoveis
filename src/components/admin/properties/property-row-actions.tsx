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

import { WhatsAppIcon } from "@/components/shared/whatsapp-icon"

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
import { getCurrentUserRealtorShareInfo } from "@/modules/realtor/actions"
import { siteConfig } from "@/config/site"
import type { PropertyStatus } from "@/generated/prisma/client"

type PropertyRowActionsProps = {
  propertyId: string
  status: PropertyStatus
  slug: string
  title?: string
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

export function PropertyRowActions({ propertyId, status, slug, title }: PropertyRowActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Se quem está logado for corretor, o link leva o próprio código de
  // indicação (?ref=<slug>) — o middleware de atribuição já existente
  // (src/middleware.ts) reconhece isso em qualquer página, sem precisar
  // de nada novo no lado público. Sem vínculo de corretor (ex.: admin
  // puro), cai pro link simples.
  async function buildShareLink() {
    const info = await getCurrentUserRealtorShareInfo()
    return {
      link: info ? `${publicUrl}?ref=${info.slug}` : publicUrl,
      realtorName: info?.name ?? null,
    }
  }

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
            onClick={async () => {
              const { link, realtorName } = await buildShareLink()
              navigator.clipboard.writeText(link)
              toast.success(
                realtorName ? `Link copiado com a indicação de ${realtorName}.` : "Link copiado."
              )
            }}
          >
            <Share2 /> Compartilhar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              const { link } = await buildShareLink()
              const message = `Olá! Separei esse imóvel${title ? ` (${title})` : ""} pra você, dá uma olhada: ${link}`
              window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer")
            }}
          >
            <WhatsAppIcon className="size-4" /> Compartilhar no WhatsApp
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
