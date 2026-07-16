import { notFound } from "next/navigation"
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LeadStageBadge } from "@/components/admin/leads/lead-stage-badge"
import { LeadDetailsForm } from "@/components/admin/leads/lead-details-form"
import { LeadInteractionForm } from "@/components/admin/leads/lead-interaction-form"
import { LeadInteractionList } from "@/components/admin/leads/lead-interaction-list"
import { LeadConvertClientButton } from "@/components/admin/leads/lead-convert-client-button"
import { AppointmentFormDialog } from "@/components/admin/agenda/appointment-form-dialog"
import { ProposalFormDialog } from "@/components/admin/proposals/proposal-form-dialog"
import { getAdminLead } from "@/modules/lead/actions"
import { listRealtors } from "@/modules/realtor/actions"

export default async function AdminLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [lead, realtors] = await Promise.all([
    getAdminLead(id),
    listRealtors(),
  ])
  if (!lead) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {lead.name}
        </h1>
        <LeadStageBadge stage={lead.stage} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-medium">Dados do lead</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <LeadDetailsForm
                leadId={lead.id}
                notes={lead.notes}
                nextActionAt={lead.nextActionAt?.toISOString().slice(0, 10) ?? null}
                realtorId={lead.realtorId}
                realtors={realtors}
              />
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Histórico de contatos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <LeadInteractionForm leadId={lead.id} />
              <LeadInteractionList interactions={lead.interactions} />
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-medium">Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>{lead.phone}</p>
              {lead.email ? <p>{lead.email}</p> : null}
              <p className="text-muted-foreground">Origem: {lead.origin}</p>
              {lead.client ? (
                <p className="text-muted-foreground">
                  Cliente: <span className="text-foreground">{lead.client.name}</span>
                </p>
              ) : (
                <LeadConvertClientButton leadId={lead.id} />
              )}
            </CardContent>
          </Card>

          {lead.property ? (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base font-medium">
                  Imóvel de interesse
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <Link
                  href={`/admin/imoveis/${lead.property.id}`}
                  className="font-medium hover:underline"
                >
                  {lead.property.title}
                </Link>
                <p className="text-muted-foreground">{lead.property.code}</p>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-medium">Agenda</CardTitle>
            </CardHeader>
            <CardContent>
              <AppointmentFormDialog
                realtors={realtors}
                leadId={lead.id}
                propertyId={lead.propertyId ?? undefined}
                contextLabel={`Visita para ${lead.name}`}
                trigger={
                  <Button variant="outline" className="w-full">
                    Agendar visita
                  </Button>
                }
              />
            </CardContent>
          </Card>

          {lead.client && lead.property ? (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base font-medium">Proposta</CardTitle>
              </CardHeader>
              <CardContent>
                <ProposalFormDialog
                  realtors={realtors}
                  clients={[lead.client]}
                  leadId={lead.id}
                  fixedPropertyId={lead.property.id}
                  fixedPropertyLabel={`${lead.property.code} · ${lead.property.title}`}
                  fixedClientId={lead.client.id}
                  trigger={
                    <Button variant="outline" className="w-full">
                      Nova proposta
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
