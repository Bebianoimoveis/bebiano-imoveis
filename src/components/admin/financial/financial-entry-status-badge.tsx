import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { FinancialEntryStatus, FinancialEntryType } from "@/generated/prisma/client"

export function isEntryOverdue(entry: { status: FinancialEntryStatus; dueDate: Date | string }) {
  if (entry.status !== "PENDING" && entry.status !== "SCHEDULED") return false
  return new Date(entry.dueDate).getTime() < Date.now()
}

const STYLES: Record<FinancialEntryStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-500",
  SCHEDULED: "bg-blue-500/10 text-blue-500",
  PARTIAL: "bg-violet-500/10 text-violet-500",
  PAID: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  CANCELED: "bg-muted text-muted-foreground",
}

const OVERDUE_STYLE = "bg-destructive/10 text-destructive"

function labelFor(status: FinancialEntryStatus, type: FinancialEntryType) {
  switch (status) {
    case "PAID":
      return type === "INCOME" ? "Recebido" : "Pago"
    case "PENDING":
      return "Pendente"
    case "SCHEDULED":
      return "Agendado"
    case "PARTIAL":
      return "Parcial"
    case "CANCELED":
      return "Cancelado"
  }
}

export const FINANCIAL_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pendente" },
  { value: "SCHEDULED", label: "Agendado" },
  { value: "PARTIAL", label: "Parcial" },
  { value: "PAID", label: "Pago/Recebido" },
  { value: "CANCELED", label: "Cancelado" },
] as const

export function FinancialEntryStatusBadge({
  status,
  type,
  dueDate,
}: {
  status: FinancialEntryStatus
  type: FinancialEntryType
  dueDate: Date | string
}) {
  const overdue = isEntryOverdue({ status, dueDate })

  return (
    <Badge variant="outline" className={cn("border-transparent", overdue ? OVERDUE_STYLE : STYLES[status])}>
      {overdue ? "Atrasado" : labelFor(status, type)}
    </Badge>
  )
}
