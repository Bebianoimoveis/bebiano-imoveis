"use client"

import { useMemo, useState } from "react"

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

  const groups = useMemo(() => {
    const byRealtor = new Map<string, { name: string; contracts: ContractListItem[] }>()
    for (const contract of contracts) {
      const key = contract.realtor.id
      const group = byRealtor.get(key)
      if (group) {
        group.contracts.push(contract)
      } else {
        byRealtor.set(key, { name: contract.realtor.user.name, contracts: [contract] })
      }
    }
    return [...byRealtor.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
  }, [contracts])

  return (
    <>
      <div className="space-y-6">
        {groups.map((group) => {
          const total = group.contracts.reduce((sum, c) => sum + Number(c.value), 0)
          return (
            <div key={group.name} className="overflow-hidden rounded-xl border border-border/60 bg-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-secondary/40 px-4 py-2.5">
                <h2 className="font-heading text-sm font-semibold">{group.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {group.contracts.length} contrato{group.contracts.length === 1 ? "" : "s"} ·{" "}
                  {formatCurrency(total.toString())}
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imóvel</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.contracts.map((contract) => (
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
          )
        })}
      </div>

      <ContractDetailPanel contractId={openId} onClose={() => setOpenId(null)} />
    </>
  )
}
