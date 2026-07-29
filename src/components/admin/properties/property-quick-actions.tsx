"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Copy, Eye, EyeOff, Pencil, Share2 } from "lucide-react"
import { toast } from "sonner"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { changePropertyStatus, duplicateProperty } from "@/modules/property/actions"
import { siteConfig } from "@/config/site"
import type { PropertyStatus } from "@/generated/prisma/client"

function QuickActionButton({
  label,
  onClick,
  href,
  children,
}: {
  label: string
  onClick?: () => void
  href?: string
  children: React.ReactNode
}) {
  const className =
    "flex size-8 items-center justify-center rounded-lg bg-background/90 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className={className}>
            {children}
          </a>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onClick?.()
            }}
            className={className}
          >
            {children}
          </button>
        )}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

// Botões que só aparecem no hover da linha/card — atalhos pras ações mais
// comuns sem precisar abrir o menu (⋯), que continua existindo por cima
// pra cobrir o resto (arquivar com confirmação, etc.) e pro touch.
export function PropertyQuickActions({
  propertyId,
  status,
  slug,
  className,
}: {
  propertyId: string
  status: PropertyStatus
  slug: string
  className?: string
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()

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

  const publicUrl = `${siteConfig.url}/imoveis/${slug}`

  return (
    <div className={className}>
      <QuickActionButton label="Editar" onClick={() => router.push(`/admin/imoveis/${propertyId}`)}>
        <Pencil className="size-4" />
      </QuickActionButton>
      <QuickActionButton label="Visualizar no site" href={publicUrl}>
        <Eye className="size-4" />
      </QuickActionButton>
      <QuickActionButton
        label="Compartilhar"
        onClick={() => {
          navigator.clipboard.writeText(publicUrl)
          toast.success("Link copiado.")
        }}
      >
        <Share2 className="size-4" />
      </QuickActionButton>
      <QuickActionButton
        label="Duplicar"
        onClick={() => runAction(() => duplicateProperty(propertyId), "Imóvel duplicado.")}
      >
        <Copy className="size-4" />
      </QuickActionButton>
      {status === "PUBLISHED" ? (
        <QuickActionButton
          label="Despublicar"
          onClick={() => runAction(() => changePropertyStatus(propertyId, "DRAFT"), "Imóvel despublicado.")}
        >
          <EyeOff className="size-4" />
        </QuickActionButton>
      ) : null}
    </div>
  )
}
