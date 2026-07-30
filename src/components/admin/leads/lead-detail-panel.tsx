"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { FileSignature, Phone, Star, Trash2 } from "lucide-react"

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
import { LeadAvatar } from "@/components/admin/leads/lead-avatar"
import { LeadOriginBadge } from "@/components/admin/leads/lead-origin-badge"
import { LeadTemperatureBadge } from "@/components/admin/leads/lead-temperature-badge"
import { LeadStageBadge } from "@/components/admin/leads/lead-stage-badge"
import { LeadDetailsForm } from "@/components/admin/leads/lead-details-form"
import { LeadInteractionForm } from "@/components/admin/leads/lead-interaction-form"
import { LeadInteractionList } from "@/components/admin/leads/lead-interaction-list"
import { LeadConvertClientButton } from "@/components/admin/leads/lead-convert-client-button"
import { LEAD_STAGE_LABELS, LEAD_STAGE_ORDER } from "@/components/admin/leads/lead-stage"
import { AppointmentFormDialog } from "@/components/admin/agenda/appointment-form-dialog"
import { AppointmentStatusBadge } from "@/components/admin/agenda/appointment-status-badge"
import { ProposalFormDialog } from "@/components/admin/proposals/proposal-form-dialog"
import { ProposalStatusBadge } from "@/components/admin/proposals/proposal-status-badge"
import { ContractStatusBadge } from "@/components/admin/contracts/contract-status-badge"
import { getAdminLead, updateLeadStage, deleteLead, getLeadContract } from "@/modules/lead/actions"
import { formatCurrency } from "@/lib/format"
import type { LeadDetail } from "@/modules/lead/repository"
import type { LeadStage } from "@/generated/prisma/client"

type RealtorOption = { id: string; user: { name: string } }
type ContractDetail = Awaited<ReturnType<typeof getLeadContract>>

export function LeadDetailPanel({
  leadId,
  onClose,
  realtors,
}: {
  leadId: string | null
  onClose: () => void
  realtors: RealtorOption[]
}) {
  const router = useRouter()
  const [lead, setLead] = useState<LeadDetail | null>(null)
  const [contract, setContract] = useState<ContractDetail>(null)
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!leadId) {
      setLead(null)
      setContract(null)
      return
    }
    setLoading(true)
    Promise.all([getAdminLead(leadId), getLeadContract(leadId)])
      .then(([leadData, contractData]) => {
        setLead(leadData)
        setContract(contractData)
      })
      .finally(() => setLoading(false))
  }, [leadId])

  function refetch() {
    if (!leadId) return
    getAdminLead(leadId).then(setLead)
  }

  function handleMove(stage: LeadStage) {
    if (!leadId) return
    startTransition(async () => {
      try {
        await updateLeadStage(leadId, stage)
        toast.success("Lead movido.")
        refetch()
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao mover lead.")
      }
    })
  }

  function handleDelete() {
    if (!leadId) return
    startTransition(async () => {
      try {
        await deleteLead(leadId)
        toast.success("Lead excluído.")
        onClose()
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao excluir lead.")
      }
    })
  }

  return (
    <Sheet open={!!leadId} onOpenChange={(open) => !open && onClose()} side="right" className="w-full max-w-lg">
      {loading || !lead ? (
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
                <LeadAvatar name={lead.name} />
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-heading text-lg font-semibold">{lead.name}</p>
                    {lead.vip ? <Star className="size-4 fill-gold text-gold" /> : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{lead.phone}</p>
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
              <LeadOriginBadge origin={lead.origin} />
              <LeadTemperatureBadge temperature={lead.temperature} />
              <LeadStageBadge stage={lead.stage} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <a href={`tel:${lead.phone}`}>
                  <Phone className="size-3.5" /> Ligar
                </a>
              </Button>
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <a
                  href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon className="size-3.5" /> WhatsApp
                </a>
              </Button>
              <Select value={lead.stage} onValueChange={(value) => handleMove(value as LeadStage)}>
                <SelectTrigger className="h-8 w-40 text-xs" disabled={isPending}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STAGE_ORDER.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {LEAD_STAGE_LABELS[stage]}
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
                    <AlertDialogTitle>Excluir este lead?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ele sai do Kanban e das listagens. O histórico de interações continua guardado, mas
                      não aparece mais em lugar nenhum do painel.
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
              <TabsTrigger value="historico">Histórico</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
              <TabsTrigger value="propostas">Propostas</TabsTrigger>
              <TabsTrigger value="contrato">Contrato</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-5">
              <TabsContent value="geral" className="space-y-5">
                <div className="space-y-1 text-sm">
                  {lead.email ? <p>{lead.email}</p> : null}
                  {lead.client ? (
                    <p className="text-muted-foreground">
                      Cliente: <span className="text-foreground">{lead.client.name}</span>
                    </p>
                  ) : (
                    <LeadConvertClientButton leadId={lead.id} />
                  )}
                </div>

                {lead.property ? (
                  <div className="rounded-xl border border-border/60 p-3 text-sm">
                    <p className="font-medium">{lead.property.title}</p>
                    <p className="text-muted-foreground">
                      {lead.property.code} · {formatCurrency(lead.property.price.toString())}
                    </p>
                  </div>
                ) : null}

                <LeadDetailsForm
                  leadId={lead.id}
                  notes={lead.notes}
                  nextActionAt={lead.nextActionAt?.toISOString().slice(0, 10) ?? null}
                  realtorId={lead.realtorId}
                  realtors={realtors}
                  temperature={lead.temperature}
                  vip={lead.vip}
                  tags={lead.tags}
                  onSuccess={refetch}
                />
              </TabsContent>

              <TabsContent value="historico" className="space-y-6">
                <LeadInteractionForm leadId={lead.id} onSuccess={refetch} />
                <LeadInteractionList interactions={lead.interactions} />
              </TabsContent>

              <TabsContent value="agenda" className="space-y-4">
                <AppointmentFormDialog
                  realtors={realtors}
                  leadId={lead.id}
                  propertyId={lead.propertyId ?? undefined}
                  contextLabel={`Visita para ${lead.name}`}
                  trigger={<Button className="w-full">Agendar visita</Button>}
                />
                {lead.appointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum agendamento ainda.</p>
                ) : (
                  <ul className="space-y-2">
                    {lead.appointments.map((appointment) => (
                      <li
                        key={appointment.id}
                        className="flex items-center justify-between rounded-xl border border-border/60 p-3 text-sm"
                      >
                        <span>{new Date(appointment.scheduledAt).toLocaleString("pt-BR")}</span>
                        <AppointmentStatusBadge status={appointment.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>

              <TabsContent value="propostas" className="space-y-4">
                {lead.client && lead.property ? (
                  <ProposalFormDialog
                    realtors={realtors}
                    clients={[lead.client]}
                    leadId={lead.id}
                    fixedPropertyId={lead.property.id}
                    fixedPropertyLabel={`${lead.property.code} · ${lead.property.title}`}
                    fixedClientId={lead.client.id}
                    trigger={<Button className="w-full">Nova proposta</Button>}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Converta o lead em cliente e vincule um imóvel para criar propostas.
                  </p>
                )}
                {lead.proposals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma proposta ainda.</p>
                ) : (
                  <ul className="space-y-2">
                    {lead.proposals.map((proposal) => (
                      <li
                        key={proposal.id}
                        className="flex items-center justify-between rounded-xl border border-border/60 p-3 text-sm"
                      >
                        <span>{formatCurrency(proposal.value.toString())}</span>
                        <ProposalStatusBadge status={proposal.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>

              <TabsContent value="contrato">
                {contract ? (
                  <div className="space-y-2 rounded-xl border border-border/60 p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{formatCurrency(contract.value.toString())}</p>
                      <ContractStatusBadge status={contract.status} />
                    </div>
                    <p className="text-muted-foreground">
                      Assinado em{" "}
                      {contract.signedAt ? new Date(contract.signedAt).toLocaleDateString("pt-BR") : "—"}
                    </p>
                  </div>
                ) : (
                  <EmptyState
                    icon={FileSignature}
                    title="Nenhum contrato ainda"
                    description="Aparece aqui quando uma proposta deste lead for aceita e virar contrato."
                  />
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}
    </Sheet>
  )
}
