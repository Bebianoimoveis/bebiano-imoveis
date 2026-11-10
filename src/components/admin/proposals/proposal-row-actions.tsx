"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Copy, Eye, FileDown, FileSignature, Mail, MoreHorizontal, Share2, Trash2 } from "lucide-react"
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
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon"
import { duplicateProposal, deleteProposal, updateProposalStatus } from "@/modules/proposal/actions"
import { formatCurrency } from "@/lib/format"
import { siteConfig } from "@/config/site"
import type { ProposalListItem } from "@/modules/proposal/repository"
import { ConvertToContractDialog, canConvertProposal } from "@/components/admin/proposals/convert-to-contract-dialog"

export function ProposalRowActions({
  proposal,
  onOpen,
}: {
  proposal: ProposalListItem
  onOpen: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [convertOpen, setConvertOpen] = useState(false)

  function runAction(action: () => Promise<unknown>, message: string) {
    startTransition(async () => {
      try {
        await action()
        toast.success(message)
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro inesperado.")
      }
    })
  }

  const shareUrl = proposal.shareToken ? `${siteConfig.url}/proposta/${proposal.shareToken}` : null
  const phone = proposal.client.phone
  const whatsappMessage = `Olá, ${proposal.client.name}! Segue a proposta para o imóvel ${proposal.property.title} (${proposal.property.code}).\n\nValor ofertado: ${formatCurrency(proposal.value.toString())}\n\nVeja todos os detalhes aqui: ${shareUrl}`

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isPending} onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={onOpen}>
            <Eye /> Ver detalhes
          </DropdownMenuItem>
          {proposal.contract ? (
            <DropdownMenuItem onClick={() => setConvertOpen(true)}>
              <FileSignature /> Ver contrato / anexar assinatura
            </DropdownMenuItem>
          ) : canConvertProposal(proposal.status) ? (
            <DropdownMenuItem onClick={() => setConvertOpen(true)} className="font-medium text-primary">
              <FileSignature /> Converter em contrato
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            onClick={() => runAction(() => duplicateProposal(proposal.id), "Proposta duplicada.")}
          >
            <Copy /> Duplicar
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={`https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon /> Enviar por WhatsApp
            </a>
          </DropdownMenuItem>
          {proposal.client.email ? (
            <DropdownMenuItem asChild>
              <a href={`mailto:${proposal.client.email}`}>
                <Mail /> Enviar por e-mail
              </a>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem asChild>
            <a href={`/proposta/${proposal.shareToken}/pdf`} target="_blank" rel="noopener noreferrer">
              <FileDown /> Gerar PDF
            </a>
          </DropdownMenuItem>
          {shareUrl ? (
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(shareUrl)
                toast.success("Link copiado.")
              }}
            >
              <Share2 /> Copiar link público
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuSeparator />

          {proposal.status !== "CANCELED" && proposal.status !== "COMPLETED" ? (
            <DropdownMenuItem
              onClick={() => runAction(() => updateProposalStatus(proposal.id, "CANCELED"), "Proposta cancelada.")}
            >
              Cancelar
            </DropdownMenuItem>
          ) : null}
          <AlertDialogTrigger asChild>
            <DropdownMenuItem variant="destructive" onSelect={(e) => e.preventDefault()}>
              <Trash2 /> Excluir
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir esta proposta?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. Se a negociação só não vai mais acontecer, prefira
            &ldquo;Cancelar&rdquo; em vez de excluir.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel />
          <AlertDialogAction onClick={() => runAction(() => deleteProposal(proposal.id), "Proposta excluída.")}>
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>

      <ConvertToContractDialog
        proposalId={proposal.id}
        hasContract={Boolean(proposal.contract)}
        open={convertOpen}
        onOpenChange={setConvertOpen}
        summary={{
          clientName: proposal.client.name,
          propertyLabel: `${proposal.property.code} · ${proposal.property.title}`,
          value: Number(proposal.value),
          realtorName: proposal.realtor.user.name,
        }}
      />
    </AlertDialog>
  )
}
