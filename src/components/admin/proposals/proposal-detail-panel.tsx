"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import NextImage from "next/image"
import { toast } from "sonner"
import {
  Copy,
  FileDown,
  FileSignature,
  ImageOff,
  Mail,
  Pencil,
  Phone,
  Send,
  Trash2,
} from "lucide-react"

import { Sheet } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { EmptyState } from "@/components/shared/empty-state"
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon"
import { ClientAvatar } from "@/components/admin/clients/client-avatar"
import { ProposalStatusBadge } from "@/components/admin/proposals/proposal-status-badge"
import { PROPOSAL_STATUS_OPTIONS } from "@/components/admin/proposals/proposal-status-badge"
import { ProposalTimeline } from "@/components/admin/proposals/proposal-timeline"
import { ProposalInteractionForm } from "@/components/admin/proposals/proposal-interaction-form"
import { ProposalEditSheet } from "@/components/admin/proposals/proposal-edit-sheet"
import { ContractStatusBadge } from "@/components/admin/contracts/contract-status-badge"
import { generateContractFromProposal } from "@/modules/contract/actions"
import {
  getAdminProposal,
  updateProposalStatus,
  deleteProposal,
  duplicateProposal,
  markProposalSent,
} from "@/modules/proposal/actions"
import { formatCurrency, getDisplayAddress } from "@/lib/format"
import { siteConfig } from "@/config/site"
import type { ProposalDetail } from "@/modules/proposal/repository"
import type { ProposalStatus } from "@/generated/prisma/client"

type RealtorOption = { id: string; user: { name: string } }

export function ProposalDetailPanel({
  proposalId,
  onClose,
  realtors,
}: {
  proposalId: string | null
  onClose: () => void
  realtors: RealtorOption[]
}) {
  const router = useRouter()
  const [proposal, setProposal] = useState<ProposalDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    if (!proposalId) {
      setProposal(null)
      return
    }
    setLoading(true)
    getAdminProposal(proposalId)
      .then(setProposal)
      .finally(() => setLoading(false))
  }, [proposalId])

  function refetch() {
    if (!proposalId) return
    getAdminProposal(proposalId).then(setProposal)
  }

  function handleMove(status: ProposalStatus) {
    if (!proposalId) return
    startTransition(async () => {
      try {
        await updateProposalStatus(proposalId, status)
        toast.success("Status atualizado.")
        refetch()
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao atualizar.")
      }
    })
  }

  function handleSend() {
    if (!proposalId) return
    startTransition(async () => {
      try {
        await markProposalSent(proposalId)
        toast.success("Proposta marcada como enviada.")
        refetch()
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao enviar.")
      }
    })
  }

  function handleDuplicate() {
    if (!proposalId) return
    startTransition(async () => {
      try {
        await duplicateProposal(proposalId)
        toast.success("Proposta duplicada.")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao duplicar.")
      }
    })
  }

  function handleDelete() {
    if (!proposalId) return
    startTransition(async () => {
      try {
        await deleteProposal(proposalId)
        toast.success("Proposta excluída.")
        onClose()
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao excluir.")
      }
    })
  }

  function handleGenerateContract() {
    if (!proposalId) return
    startTransition(async () => {
      try {
        await generateContractFromProposal(proposalId)
        toast.success("Contrato gerado.")
        refetch()
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao gerar contrato.")
      }
    })
  }

  const shareUrl = proposal?.shareToken ? `${siteConfig.url}/proposta/${proposal.shareToken}` : null
  const cover = proposal?.property.images.find((i) => i.isCover)?.url ?? proposal?.property.images[0]?.url

  return (
    <>
      <Sheet
        open={!!proposalId}
        onOpenChange={(open) => !open && onClose()}
        side="right"
        className="w-full max-w-xl"
      >
        {loading || !proposal ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="border-b border-border/60 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ClientAvatar name={proposal.client.name} />
                  <div>
                    <p className="font-heading text-lg font-semibold">{proposal.client.name}</p>
                    <p className="text-sm text-muted-foreground">{proposal.property.title}</p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Fechar"
                  onClick={onClose}
                  className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <ProposalStatusBadge status={proposal.status} />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditOpen(true)}>
                  <Pencil className="size-3.5" /> Editar
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={handleDuplicate} disabled={isPending}>
                  <Copy className="size-3.5" /> Duplicar
                </Button>
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <a href={`tel:${proposal.client.phone}`}>
                    <Phone className="size-3.5" /> Ligar
                  </a>
                </Button>
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <a
                    href={`https://wa.me/${proposal.client.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <WhatsAppIcon className="size-3.5" /> WhatsApp
                  </a>
                </Button>
                {proposal.client.email ? (
                  <Button asChild size="sm" variant="outline" className="gap-1.5">
                    <a href={`mailto:${proposal.client.email}`}>
                      <Mail className="size-3.5" /> E-mail
                    </a>
                  </Button>
                ) : null}
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <a href={`/proposta/${proposal.shareToken}/pdf`} target="_blank" rel="noopener noreferrer">
                    <FileDown className="size-3.5" /> PDF
                  </a>
                </Button>
                {proposal.status === "DRAFT" ? (
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={handleSend} disabled={isPending}>
                    <Send className="size-3.5" /> Enviar
                  </Button>
                ) : null}
                <Select value={proposal.status} onValueChange={(v) => handleMove(v as ProposalStatus)}>
                  <SelectTrigger className="h-8 w-44 text-xs" disabled={isPending}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPOSAL_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive">
                      <Trash2 className="size-3.5" /> Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir esta proposta?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Essa ação não pode ser desfeita. Se a negociação só não vai mais acontecer, prefira
                        cancelar em vez de excluir.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel />
                      <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <Tabs defaultValue="geral" className="flex min-h-0 flex-1 flex-col">
              <TabsList className="mx-5 mt-3 w-fit">
                <TabsTrigger value="geral">Visão Geral</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="documentos">Documentos</TabsTrigger>
                <TabsTrigger value="notas">Notas</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto p-5">
                <TabsContent value="geral" className="space-y-5">
                  <div className="overflow-hidden rounded-xl border border-border/60">
                    <div className="relative h-40 w-full bg-secondary">
                      {cover ? (
                        <NextImage src={cover} alt={proposal.property.title} fill className="object-cover" sizes="480px" />
                      ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground">
                          <ImageOff className="size-6" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1 p-3">
                      <p className="font-medium">{proposal.property.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {proposal.property.code} · {getDisplayAddress(proposal.property)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-border/60 p-3">
                      <p className="text-xs text-muted-foreground">Valor anunciado</p>
                      <p className="font-semibold">
                        {proposal.originalValue ? formatCurrency(proposal.originalValue.toString()) : "—"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/60 p-3">
                      <p className="text-xs text-muted-foreground">Valor ofertado</p>
                      <p className="font-semibold text-primary">{formatCurrency(proposal.value.toString())}</p>
                    </div>
                    {proposal.downPayment ? (
                      <div className="rounded-xl border border-border/60 p-3">
                        <p className="text-xs text-muted-foreground">Entrada</p>
                        <p className="font-medium">{formatCurrency(proposal.downPayment.toString())}</p>
                      </div>
                    ) : null}
                    {proposal.financingValue ? (
                      <div className="rounded-xl border border-border/60 p-3">
                        <p className="text-xs text-muted-foreground">Financiamento</p>
                        <p className="font-medium">{formatCurrency(proposal.financingValue.toString())}</p>
                      </div>
                    ) : null}
                    {proposal.fgtsValue ? (
                      <div className="rounded-xl border border-border/60 p-3">
                        <p className="text-xs text-muted-foreground">FGTS</p>
                        <p className="font-medium">{formatCurrency(proposal.fgtsValue.toString())}</p>
                      </div>
                    ) : null}
                    {proposal.installments ? (
                      <div className="rounded-xl border border-border/60 p-3">
                        <p className="text-xs text-muted-foreground">Parcelas</p>
                        <p className="font-medium">
                          {proposal.installments}x {proposal.installmentValue ? formatCurrency(proposal.installmentValue.toString()) : ""}
                        </p>
                      </div>
                    ) : null}
                    {proposal.commissionPercent ? (
                      <div className="rounded-xl border border-border/60 p-3">
                        <p className="text-xs text-muted-foreground">Comissão</p>
                        <p className="font-medium">{proposal.commissionPercent.toString()}%</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Corretor</p>
                    <p className="font-medium">{proposal.realtor.user.name}</p>
                  </div>

                  {proposal.paymentMethod ? (
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">Forma de pagamento</p>
                      <p className="font-medium">{proposal.paymentMethod}</p>
                    </div>
                  ) : null}

                  {proposal.validUntil ? (
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">Válida até</p>
                      <p className="font-medium">{new Date(proposal.validUntil).toLocaleDateString("pt-BR")}</p>
                    </div>
                  ) : null}

                  {proposal.notes ? (
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">Observações</p>
                      <p>{proposal.notes}</p>
                    </div>
                  ) : null}

                  {shareUrl ? (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">Link público de acompanhamento</p>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(shareUrl)
                          toast.success("Link copiado.")
                        }}
                        className="flex w-full items-center justify-between gap-2 truncate rounded-lg border border-border/60 px-3 py-2 text-left text-xs text-primary hover:bg-secondary"
                      >
                        <span className="truncate">{shareUrl}</span>
                        <Copy className="size-3.5 shrink-0" />
                      </button>
                    </div>
                  ) : null}
                </TabsContent>

                <TabsContent value="timeline">
                  <ProposalTimeline proposal={proposal} />
                </TabsContent>

                <TabsContent value="documentos" className="space-y-4">
                  {proposal.contract ? (
                    <div className="space-y-2 rounded-xl border border-border/60 p-4 text-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Contrato</p>
                        <ContractStatusBadge status={proposal.contract.status} />
                      </div>
                      <p className="text-muted-foreground">{formatCurrency(proposal.contract.value.toString())}</p>
                      {proposal.contract.fileUrl ? (
                        <Button asChild size="sm" variant="outline">
                          <a href={proposal.contract.fileUrl} target="_blank" rel="noopener noreferrer">
                            Baixar contrato assinado
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  ) : proposal.status === "ACCEPTED" ? (
                    <Button className="w-full" onClick={handleGenerateContract} disabled={isPending}>
                      Gerar contrato
                    </Button>
                  ) : (
                    <EmptyState
                      icon={FileSignature}
                      title="Nenhum documento ainda"
                      description="O contrato aparece aqui quando a proposta for aceita e o contrato gerado."
                    />
                  )}

                  <Button asChild variant="outline" className="w-full gap-1.5">
                    <a href={`/proposta/${proposal.shareToken}/pdf`} target="_blank" rel="noopener noreferrer">
                      <FileDown className="size-3.5" /> Baixar PDF da proposta
                    </a>
                  </Button>
                </TabsContent>

                <TabsContent value="notas" className="space-y-6">
                  <ProposalInteractionForm proposalId={proposal.id} onSuccess={refetch} />
                  <ul className="space-y-4">
                    {proposal.interactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhuma anotação registrada ainda.</p>
                    ) : (
                      proposal.interactions.map((interaction) => (
                        <li key={interaction.id} className="rounded-xl border border-border/60 p-3 text-sm">
                          <p>{interaction.description}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {interaction.user.name} · {new Date(interaction.createdAt).toLocaleString("pt-BR")}
                          </p>
                        </li>
                      ))
                    )}
                  </ul>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}
      </Sheet>

      {proposal ? (
        <ProposalEditSheet open={editOpen} onOpenChange={setEditOpen} proposal={proposal} onSuccess={refetch} />
      ) : null}
    </>
  )
}
