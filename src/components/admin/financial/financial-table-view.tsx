"use client"

import { ArrowDownCircle, ArrowUpCircle } from "lucide-react"

import { FinancialEntryStatusBadge } from "@/components/admin/financial/financial-entry-status-badge"
import { FinancialEntryRowActions } from "@/components/admin/financial/financial-entry-row-actions"
import { ClientAvatar } from "@/components/admin/clients/client-avatar"
import { formatCurrency } from "@/lib/format"
import type { FinancialEntryListItem } from "@/modules/financial/repository"

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PIX: "PIX",
  TED: "TED",
  CARD: "Cartão",
  CASH: "Dinheiro",
  BOLETO: "Boleto",
  TRANSFER: "Transferência",
  CHECK: "Cheque",
}

export function FinancialTableView({
  entries,
  onOpen,
  onEdit,
}: {
  entries: FinancialEntryListItem[]
  onOpen: (id: string) => void
  onEdit: (entry: FinancialEntryListItem) => void
}) {
  return (
    <div className="overflow-x-auto rounded-[20px] border border-border/60 bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left text-xs font-medium text-muted-foreground uppercase">
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Categoria</th>
            <th className="px-4 py-3">Descrição</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Corretor</th>
            <th className="px-4 py-3">Imóvel</th>
            <th className="px-4 py-3">Valor</th>
            <th className="px-4 py-3">Vencimento</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Pagamento</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.id}
              onClick={() => onOpen(entry.id)}
              className="cursor-pointer border-b border-border/40 transition-colors last:border-0 hover:bg-secondary/20"
            >
              <td className="px-4 py-3">
                {entry.type === "INCOME" ? (
                  <ArrowUpCircle className="size-4 text-emerald-500" />
                ) : (
                  <ArrowDownCircle className="size-4 text-destructive" />
                )}
              </td>
              <td className="px-4 py-3 font-medium">{entry.category}</td>
              <td className="px-4 py-3 max-w-48 truncate text-muted-foreground">{entry.description ?? "—"}</td>
              <td className="px-4 py-3">
                {entry.client ? (
                  <div className="flex items-center gap-2">
                    <ClientAvatar name={entry.client.name} size="sm" />
                    <span className="truncate">{entry.client.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{entry.realtor?.user.name ?? "—"}</td>
              <td className="px-4 py-3 max-w-36 truncate text-muted-foreground">
                {entry.property ? `${entry.property.code} · ${entry.property.title}` : "—"}
              </td>
              <td className="px-4 py-3 font-medium">{formatCurrency(entry.amount.toString())}</td>
              <td className="px-4 py-3 text-muted-foreground">{new Date(entry.dueDate).toLocaleDateString("pt-BR")}</td>
              <td className="px-4 py-3">
                <FinancialEntryStatusBadge status={entry.status} type={entry.type} dueDate={entry.dueDate} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {entry.paymentMethod ? PAYMENT_METHOD_LABELS[entry.paymentMethod] : "—"}
              </td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <FinancialEntryRowActions entry={entry} onOpen={() => onOpen(entry.id)} onEdit={() => onEdit(entry)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
