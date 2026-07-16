import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ContractStatus } from "@/generated/prisma/client"

const LABELS: Record<ContractStatus, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativo",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
}

const STYLES: Record<ContractStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  ACTIVE: "bg-primary/10 text-primary",
  COMPLETED: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  CANCELED: "bg-destructive/10 text-destructive",
}

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", STYLES[status])}>
      {LABELS[status]}
    </Badge>
  )
}
