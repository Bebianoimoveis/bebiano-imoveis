import { FileSignature } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { ContractDirectory } from "@/components/admin/contracts/contract-directory"
import { listAdminContracts } from "@/modules/contract/actions"
import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"

export default async function AdminContractsPage() {
  const session = await auth()
  const [contracts, canManageFinancial] = await Promise.all([
    listAdminContracts(),
    can(session?.user, "financial.manage"),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Contratos
        </h1>
        <p className="text-sm text-muted-foreground">
          Contratos gerados a partir de propostas aceitas.
        </p>
      </div>

      {contracts.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title="Nenhum contrato ainda"
          description="Contratos são gerados a partir de propostas com status aceito."
        />
      ) : (
        <ContractDirectory contracts={contracts} canManageFinancial={canManageFinancial} />
      )}
    </div>
  )
}
