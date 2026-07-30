"use client"

import { ArrowDownCircle, ArrowUpCircle } from "lucide-react"

import { FinancialEntryStatusBadge } from "@/components/admin/financial/financial-entry-status-badge"
import { FinancialEntryRowActions } from "@/components/admin/financial/financial-entry-row-actions"
import { formatCurrency } from "@/lib/format"
import type { FinancialEntryListItem } from "@/modules/financial/repository"

export function FinancialCardsView({
  entries,
  onOpen,
  onEdit,
}: {
  entries: FinancialEntryListItem[]
  onOpen: (id: string) => void
  onEdit: (entry: FinancialEntryListItem) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {entries.map((entry) => (
        <div
          key={entry.id}
          onClick={() => onOpen(entry.id)}
          className="cursor-pointer space-y-2 rounded-[20px] border border-border/60 bg-card p-4 transition-shadow hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {entry.type === "INCOME" ? (
                <ArrowUpCircle className="size-4 shrink-0 text-emerald-500" />
              ) : (
                <ArrowDownCircle className="size-4 shrink-0 text-destructive" />
              )}
              <p className="truncate text-sm font-medium">{entry.category}</p>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <FinancialEntryRowActions entry={entry} onOpen={() => onOpen(entry.id)} onEdit={() => onEdit(entry)} />
            </div>
          </div>
          <p className="font-heading text-lg font-semibold">{formatCurrency(entry.amount.toString())}</p>
          <p className="truncate text-xs text-muted-foreground">
            {entry.client?.name ?? entry.realtor?.user.name ?? entry.property?.title ?? "Sem vínculo"}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{new Date(entry.dueDate).toLocaleDateString("pt-BR")}</span>
            <FinancialEntryStatusBadge status={entry.status} type={entry.type} dueDate={entry.dueDate} />
          </div>
        </div>
      ))}
    </div>
  )
}
