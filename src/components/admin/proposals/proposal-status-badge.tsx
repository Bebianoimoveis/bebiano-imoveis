import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ProposalStatus } from "@/generated/prisma/client"

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  DRAFT: "Rascunho",
  SENT: "Enviada",
  VIEWED: "Visualizada",
  NEGOTIATING: "Em negociação",
  ACCEPTED: "Aceita",
  REJECTED: "Recusada",
  SIGNING: "Assinando",
  COMPLETED: "Concluída",
  CANCELED: "Cancelada",
}

const STYLES: Record<ProposalStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SENT: "bg-blue-500/10 text-blue-500",
  VIEWED: "bg-violet-500/10 text-violet-500",
  NEGOTIATING: "bg-amber-500/10 text-amber-500",
  ACCEPTED: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  REJECTED: "bg-destructive/10 text-destructive",
  SIGNING: "bg-primary/10 text-primary",
  COMPLETED: "bg-emerald-700/15 text-emerald-800 dark:text-emerald-300",
  CANCELED: "bg-destructive/10 text-destructive",
}

export const PROPOSAL_STATUS_DOT: Record<ProposalStatus, string> = {
  DRAFT: "bg-muted-foreground",
  SENT: "bg-blue-500",
  VIEWED: "bg-violet-500",
  NEGOTIATING: "bg-amber-500",
  ACCEPTED: "bg-emerald-500",
  REJECTED: "bg-destructive",
  SIGNING: "bg-primary",
  COMPLETED: "bg-emerald-700",
  CANCELED: "bg-muted-foreground",
}

export const PROPOSAL_STATUS_ORDER: ProposalStatus[] = [
  "DRAFT",
  "SENT",
  "VIEWED",
  "NEGOTIATING",
  "ACCEPTED",
  "SIGNING",
  "COMPLETED",
  "REJECTED",
  "CANCELED",
]

export const PROPOSAL_STATUS_OPTIONS = PROPOSAL_STATUS_ORDER.map((value) => ({
  value,
  label: PROPOSAL_STATUS_LABELS[value],
}))

export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", STYLES[status])}>
      {PROPOSAL_STATUS_LABELS[status]}
    </Badge>
  )
}
