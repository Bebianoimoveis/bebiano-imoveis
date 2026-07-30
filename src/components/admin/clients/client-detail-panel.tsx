"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { FileText, Mail, Phone, Star, Trash2, Users2 } from "lucide-react"

import { Sheet } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { ClientStatusBadge } from "@/components/admin/clients/client-status-badge"
import { ClientTypeBadge } from "@/components/admin/clients/client-type-badge"
import { ClientDetailsForm } from "@/components/admin/clients/client-details-form"
import { ClientPreferenceForm } from "@/components/admin/clients/client-preference-form"
import { ClientTimeline } from "@/components/admin/clients/client-timeline"
import { ClientInteractionForm } from "@/components/admin/clients/client-interaction-form"
import { ClientInteractionList } from "@/components/admin/clients/client-interaction-list"
import { LeadOriginBadge } from "@/components/admin/leads/lead-origin-badge"
import { LeadStageBadge } from "@/components/admin/leads/lead-stage-badge"
import { AppointmentFormDialog } from "@/components/admin/agenda/appointment-form-dialog"
import { AppointmentStatusBadge } from "@/components/admin/agenda/appointment-status-badge"
import { ProposalFormDialog } from "@/components/admin/proposals/proposal-form-dialog"
import { ProposalStatusBadge } from "@/components/admin/proposals/proposal-status-badge"
import { ContractStatusBadge } from "@/components/admin/contracts/contract-status-badge"
import { getAdminClient, deleteClient } from "@/modules/client/actions"
import { formatCurrency } from "@/lib/format"
import type { ClientDetail } from "@/modules/client/repository"

type RealtorOption = { id: string; user: { name: string } }
type CityOption = { id: string; name: string; state: string }
type PropertyTypeOption = { id: string; name: string }

export function ClientDetailPanel({
  clientId,
  onClose,
  realtors,
  cities,
  propertyTypes,
}: {
  clientId: string | null
  onClose: () => void
  realtors: RealtorOption[]
  cities: CityOption[]
  propertyTypes: PropertyTypeOption[]
}) {
  const router = useRouter()
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!clientId) {
      setClient(null)
      return
    }
    setLoading(true)
    getAdminClient(clientId)
      .then(setClient)
      .finally(() => setLoading(false))
  }, [clientId])

  function refetch() {
    if (!clientId) return
    getAdminClient(clientId).then(setClient)
  }

  function handleDelete() {
    if (!clientId) return
    startTransition(async () => {
      try {
        await deleteClient(clientId)
        toast.success("Cliente excluído.")
        onClose()
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao excluir cliente.")
      }
    })
  }

  return (
    <Sheet
      open={!!clientId}
      onOpenChange={(open) => !open && onClose()}
      side="right"
      className="w-full max-w-lg"
    >
      {loading || !client ? (
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
                <ClientAvatar name={client.name} />
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-heading text-lg font-semibold">{client.name}</p>
                    {client.vip ? <Star className="size-4 fill-gold text-gold" /> : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {client.code} · {client.phone}
                  </p>
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
              <ClientStatusBadge status={client.status} />
              {client.origin ? <LeadOriginBadge origin={client.origin} /> : null}
              {client.types.map((type) => (
                <ClientTypeBadge key={type} type={type} />
              ))}
              {client.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <a href={`tel:${client.phone}`}>
                  <Phone className="size-3.5" /> Ligar
                </a>
              </Button>
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <a
                  href={`https://wa.me/${client.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon className="size-3.5" /> WhatsApp
                </a>
              </Button>
              {client.email ? (
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <a href={`mailto:${client.email}`}>
                    <Mail className="size-3.5" /> E-mail
                  </a>
                </Button>
              ) : null}
              <AppointmentFormDialog
                realtors={realtors}
                clientId={client.id}
                contextLabel={`Visita para ${client.name}`}
                trigger={
                  <Button size="sm" variant="outline">
                    Agendar visita
                  </Button>
                }
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive">
                    <Trash2 className="size-3.5" /> Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir este cliente?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ele sai da listagem ativa. Leads, propostas e contratos vinculados continuam
                      guardados, mas não aparecem mais em lugar nenhum do painel.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel />
                    <AlertDialogAction onClick={handleDelete} disabled={isPending}>
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <Tabs defaultValue="geral" className="flex min-h-0 flex-1 flex-col">
            <TabsList className="mx-5 mt-3 w-fit flex-wrap">
              <TabsTrigger value="geral">Visão Geral</TabsTrigger>
              <TabsTrigger value="preferencias">Preferências</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
              <TabsTrigger value="propostas">Propostas</TabsTrigger>
              <TabsTrigger value="contratos">Contratos</TabsTrigger>
              <TabsTrigger value="leads">Leads</TabsTrigger>
              <TabsTrigger value="notas">Notas</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-5">
              <TabsContent value="geral">
                <ClientDetailsForm
                  client={client}
                  realtors={realtors}
                  cities={cities}
                  onSuccess={refetch}
                />
              </TabsContent>

              <TabsContent value="preferencias">
                <ClientPreferenceForm
                  clientId={client.id}
                  preference={client.preference}
                  cities={cities}
                  propertyTypes={propertyTypes}
                  onSuccess={refetch}
                />
              </TabsContent>

              <TabsContent value="timeline">
                <ClientTimeline client={client} />
              </TabsContent>

              <TabsContent value="agenda" className="space-y-4">
                <AppointmentFormDialog
                  realtors={realtors}
                  clientId={client.id}
                  contextLabel={`Visita para ${client.name}`}
                  trigger={<Button className="w-full">Agendar visita</Button>}
                />
                {client.appointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum agendamento ainda.</p>
                ) : (
                  <ul className="space-y-2">
                    {client.appointments.map((appointment) => (
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
                <ProposalFormDialog
                  realtors={realtors}
                  clients={[client]}
                  fixedClientId={client.id}
                  trigger={<Button className="w-full">Nova proposta</Button>}
                />
                {client.proposals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma proposta ainda.</p>
                ) : (
                  <ul className="space-y-2">
                    {client.proposals.map((proposal) => (
                      <li
                        key={proposal.id}
                        className="flex items-center justify-between rounded-xl border border-border/60 p-3 text-sm"
                      >
                        <span>
                          {proposal.property.title} · {formatCurrency(proposal.value.toString())}
                        </span>
                        <ProposalStatusBadge status={proposal.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>

              <TabsContent value="contratos">
                {client.contracts.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="Nenhum contrato ainda"
                    description="Aparece aqui quando uma proposta deste cliente virar contrato."
                  />
                ) : (
                  <ul className="space-y-2">
                    {client.contracts.map((contract) => (
                      <li key={contract.id} className="space-y-1 rounded-xl border border-border/60 p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{contract.property.title}</span>
                          <ContractStatusBadge status={contract.status} />
                        </div>
                        <p className="text-muted-foreground">
                          {formatCurrency(contract.value.toString())} · Assinado em{" "}
                          {contract.signedAt ? new Date(contract.signedAt).toLocaleDateString("pt-BR") : "—"}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>

              <TabsContent value="leads">
                {client.leads.length === 0 ? (
                  <EmptyState
                    icon={Users2}
                    title="Nenhum lead vinculado"
                    description="Leads convertidos para este cliente aparecem aqui."
                  />
                ) : (
                  <ul className="space-y-2">
                    {client.leads.map((lead) => (
                      <li key={lead.id}>
                        <Link
                          href={`/admin/leads/${lead.id}`}
                          className="flex items-center justify-between rounded-xl border border-border/60 p-3 text-sm transition-colors hover:border-primary/30 hover:bg-secondary/20"
                        >
                          <span>{lead.name}</span>
                          <LeadStageBadge stage={lead.stage} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>

              <TabsContent value="notas" className="space-y-6">
                <ClientInteractionForm clientId={client.id} onSuccess={refetch} />
                <ClientInteractionList
                  interactions={client.interactions}
                  emptyMessage="Nenhuma anotação registrada ainda."
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}
    </Sheet>
  )
}
