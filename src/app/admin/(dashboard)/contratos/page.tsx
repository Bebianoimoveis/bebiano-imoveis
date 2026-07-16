import { FileSignature } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/shared/empty-state"
import { ContractStatusBadge } from "@/components/admin/contracts/contract-status-badge"
import { ContractRowActions } from "@/components/admin/contracts/contract-row-actions"
import { FinancialEntryFormDialog } from "@/components/admin/financial/financial-entry-form-dialog"
import { listAdminContracts } from "@/modules/contract/actions"
import { formatCurrency } from "@/lib/format"
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
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imóvel</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Corretor</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="max-w-xs truncate text-sm">
                    {contract.property.code} · {contract.property.title}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {contract.client.name}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {contract.realtor.user.name}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatCurrency(contract.value.toString())}
                  </TableCell>
                  <TableCell>
                    <ContractStatusBadge status={contract.status} />
                  </TableCell>
                  <TableCell className="flex items-center gap-1">
                    <ContractRowActions contractId={contract.id} status={contract.status} />
                    {canManageFinancial ? (
                      <FinancialEntryFormDialog
                        contracts={[]}
                        fixedContractId={contract.id}
                        fixedContractLabel={`${contract.property.code} · ${contract.client.name}`}
                        trigger={
                          <Button variant="ghost" size="sm">
                            Lançamento
                          </Button>
                        }
                      />
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
