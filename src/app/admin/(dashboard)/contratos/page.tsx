import { FileSignature, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { ContractDirectory } from "@/components/admin/contracts/contract-directory"
import { ManualContractFormDialog } from "@/components/admin/contracts/manual-contract-form-dialog"
import { listAdminContracts } from "@/modules/contract/actions"
import { listAdminClients } from "@/modules/client/actions"
import { listRealtors } from "@/modules/realtor/actions"
import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"

export default async function AdminContractsPage() {
  const session = await auth()
  const [contracts, canManageFinancial, canManageContracts, clients, realtors] = await Promise.all([
    listAdminContracts(),
    can(session?.user, "financial.manage"),
    can(session?.user, "contract.manage"),
    listAdminClients({}),
    listRealtors(),
  ])

  const clientOptions = clients.map((c) => ({ id: c.id, name: c.name }))
  const realtorOptions = realtors.map((r) => ({ id: r.id, user: { name: r.user.name } }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Contratos
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerados a partir de propostas aceitas, ou cadastrados direto aqui — anexe contratos assinados e
            comprovantes em cada um.
          </p>
        </div>
        {canManageContracts ? (
          <ManualContractFormDialog
            clients={clientOptions}
            realtors={realtorOptions}
            trigger={
              <Button className="gap-1.5">
                <Plus className="size-4" /> Novo contrato
              </Button>
            }
          />
        ) : null}
      </div>

      {contracts.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title="Nenhum contrato ainda"
          description="Contratos são gerados a partir de propostas aceitas, ou você pode cadastrar um direto em 'Novo contrato'."
        />
      ) : (
        <ContractDirectory contracts={contracts} canManageFinancial={canManageFinancial} />
      )}
    </div>
  )
}
