"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ContractStatusBadge } from "@/components/admin/contracts/contract-status-badge"
import { ContractRowActions } from "@/components/admin/contracts/contract-row-actions"
import { ContractDetailPanel } from "@/components/admin/contracts/contract-detail-panel"
import { FinancialEntryFormDialog } from "@/components/admin/financial/financial-entry-form-dialog"
import { formatCurrency } from "@/lib/format"
import type { ContractListItem } from "@/modules/contract/repository"

export function ContractDirectory({
  contracts,
  canManageFinancial,
}: {
  contracts: ContractListItem[]
  canManageFinancial: boolean
}) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <>
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
              <TableRow
                key={contract.id}
                className="cursor-pointer"
                onClick={() => setOpenId(contract.id)}
              >
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
                <TableCell className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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

      <ContractDetailPanel contractId={openId} onClose={() => setOpenId(null)} />
    </>
  )
}
