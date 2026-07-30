"use client"

import { ArrowDownCircle, ArrowUpCircle } from "lucide-react"

import { FinancialEntryStatusBadge } from "@/components/admin/financial/financial-entry-status-badge"
import { formatCurrency } from "@/lib/format"
import type { FinancialEntryListItem } from "@/modules/financial/repository"

export function FinancialListView({
  entries,
  onOpen,
}: {
  entries: FinancialEntryListItem[]
  onOpen: (id: string) => void
}) {
  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <button
          key={entry.id}
          type="button"
          onClick={() => onOpen(entry.id)}
          className="flex w-full items-center gap-3 rounded-[20px] border border-border/60 bg-card p-3 text-left"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            {entry.type === "INCOME" ? (
              <ArrowUpCircle className="size-4 text-emerald-500" />
            ) : (
              <ArrowDownCircle className="size-4 text-destructive" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{entry.category}</p>
            <p className="truncate text-xs text-muted-foreground">
              {entry.client?.name ?? entry.realtor?.user.name ?? "Sem vínculo"} · {formatCurrency(entry.amount.toString())}
            </p>
            <p className="text-[11px] text-muted-foreground">{new Date(entry.dueDate).toLocaleDateString("pt-BR")}</p>
          </div>
          <FinancialEntryStatusBadge status={entry.status} type={entry.type} dueDate={entry.dueDate} />
        </button>
      ))}
    </div>
  )
}
