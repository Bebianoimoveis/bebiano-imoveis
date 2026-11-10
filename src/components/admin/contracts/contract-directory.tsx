"use client"

import { useMemo, useState } from "react"
import { FileSignature } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ContractStatusMenu } from "@/components/admin/contracts/contract-status-menu"
import { ContractRowActions } from "@/components/admin/contracts/contract-row-actions"
import { ContractDetailPanel } from "@/components/admin/contracts/contract-detail-panel"
import { FinancialEntryFormDialog } from "@/components/admin/financial/financial-entry-form-dialog"
import { formatCurrency } from "@/lib/format"
import type { ContractStatus } from "@/generated/prisma/client"

// Linha já "achatada" no servidor (sem Decimal/Date do Prisma) — é o que
// a página manda pro navegador.
export type ContractRow = {
  id: string
  status: ContractStatus
  value: number
  createdAt: string
  property: { id: string; code: string; title: string }
  client: { id: string; name: string; cpf: string | null; rg: string | null; phone: string }
  realtor: { id: string; name: string; photoUrl: string | null; photoPositionY: number | null; creci: string | null }
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
}

export function ContractDirectory({
  contracts,
  canManageFinancial,
  canManageContracts,
  initialOpenId = null,
}: {
  contracts: ContractRow[]
  canManageFinancial: boolean
  canManageContracts: boolean
  // ?contrato=<id> — vindo da conversão de uma proposta, já abre o contrato.
  initialOpenId?: string | null
}) {
  const [openId, setOpenId] = useState<string | null>(initialOpenId)

  const groups = useMemo(() => {
    const byRealtor = new Map<string, { realtor: ContractRow["realtor"]; contracts: ContractRow[] }>()
    for (const contract of contracts) {
      const group = byRealtor.get(contract.realtor.id)
      if (group) group.contracts.push(contract)
      else byRealtor.set(contract.realtor.id, { realtor: contract.realtor, contracts: [contract] })
    }
    return [...byRealtor.values()].sort((a, b) => a.realtor.name.localeCompare(b.realtor.name, "pt-BR"))
  }, [contracts])

  return (
    <>
      <div className="space-y-6">
        {groups.map(({ realtor, contracts: rows }) => {
          const valid = rows.filter((c) => c.status !== "CANCELED")
          const total = valid.reduce((sum, c) => sum + c.value, 0)
          const completed = rows.filter((c) => c.status === "COMPLETED").length
          return (
            <div key={realtor.id} className="overflow-hidden rounded-[20px] border border-border/60 bg-card shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-secondary/40 px-4 py-3 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-11 overflow-hidden rounded-full ring-2 ring-primary/20">
                    {realtor.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={realtor.photoUrl}
                        alt={realtor.name}
                        className="size-full rounded-full object-cover"
                        style={{ objectPosition: `50% ${realtor.photoPositionY ?? 0}%` }}
                      />
                    ) : (
                      <AvatarFallback className="bg-primary/15 font-semibold text-primary">
                        {initials(realtor.name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="min-w-0">
                    <h2 className="truncate font-heading text-base font-semibold">{realtor.name}</h2>
                    <p className="truncate text-xs text-muted-foreground">
                      {realtor.creci ? `CRECI ${realtor.creci}` : "Corretor(a)"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-background/70 px-2.5 py-1 font-medium">
                    {rows.length} contrato{rows.length === 1 ? "" : "s"}
                  </span>
                  {completed > 0 ? (
                    <span className="rounded-full bg-emerald-600/10 px-2.5 py-1 font-medium text-emerald-700 dark:text-emerald-400">
                      {completed} concluído{completed === 1 ? "" : "s"}
                    </span>
                  ) : null}
                  <span className="rounded-full bg-primary/15 px-2.5 py-1 font-semibold text-foreground">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imóvel</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Cadastro</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((contract) => (
                    <TableRow key={contract.id} className="cursor-pointer" onClick={() => setOpenId(contract.id)}>
                      <TableCell className="max-w-xs">
                        <p className="truncate text-sm font-medium">{contract.property.title}</p>
                        <p className="text-xs text-muted-foreground">{contract.property.code}</p>
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <p className="truncate text-sm">{contract.client.name}</p>
                        {contract.client.cpf || contract.client.rg ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {contract.client.cpf ? `CPF ${contract.client.cpf}` : `RG ${contract.client.rg}`}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-sm font-medium whitespace-nowrap">{formatCurrency(contract.value)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <ContractStatusMenu
                          contractId={contract.id}
                          status={contract.status}
                          canManage={canManageContracts}
                        />
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                        {formatDay(contract.createdAt)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
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
                        </div>
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

export function ContractNoResults() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[20px] border border-dashed border-border py-14 text-center">
      <FileSignature className="size-7 text-muted-foreground" />
      <p className="text-sm font-medium">Nenhum contrato encontrado</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Tente outro nome, CPF, RG ou código do imóvel, ou limpe os filtros.
      </p>
    </div>
  )
}
