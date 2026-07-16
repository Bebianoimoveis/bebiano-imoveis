import { FileText, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { ProposalFormDialog } from "@/components/admin/proposals/proposal-form-dialog"
import { ProposalTable } from "@/components/admin/proposals/proposal-table"
import { listAdminProposals } from "@/modules/proposal/actions"
import { listAdminClients } from "@/modules/client/actions"
import { listRealtors } from "@/modules/realtor/actions"

export default async function AdminProposalsPage() {
  const [proposals, clients, realtors] = await Promise.all([
    listAdminProposals(),
    listAdminClients({}),
    listRealtors(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Propostas
          </h1>
          <p className="text-sm text-muted-foreground">
            Propostas comerciais vinculadas a imóveis e clientes.
          </p>
        </div>
        <ProposalFormDialog
          realtors={realtors}
          clients={clients}
          trigger={
            <Button>
              <Plus className="size-4" />
              Nova proposta
            </Button>
          }
        />
      </div>

      {proposals.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhuma proposta registrada"
          description="Propostas criadas a partir de leads ou manualmente aparecem aqui."
        />
      ) : (
        <ProposalTable proposals={proposals} />
      )}
    </div>
  )
}
