import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ProposalStatus } from "@/generated/prisma/client"

const LABELS: Record<ProposalStatus, string> = {
  OPEN: "Em aberto",
  ACCEPTED: "Aceita",
  REJECTED: "Recusada",
  CANCELED: "Cancelada",
}

const STYLES: Record<ProposalStatus, string> = {
  OPEN: "bg-muted text-muted-foreground",
  ACCEPTED: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  REJECTED: "bg-destructive/10 text-destructive",
  CANCELED: "bg-destructive/10 text-destructive",
}

export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", STYLES[status])}>
      {LABELS[status]}
    </Badge>
  )
}
