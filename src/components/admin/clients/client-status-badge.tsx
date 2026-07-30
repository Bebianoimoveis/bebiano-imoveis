import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ClientStatus } from "@/generated/prisma/client"

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
}

const STYLES: Record<ClientStatus, string> = {
  ACTIVE: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  INACTIVE: "bg-muted text-muted-foreground",
}

export const CLIENT_STATUS_OPTIONS = (Object.keys(CLIENT_STATUS_LABELS) as ClientStatus[]).map((value) => ({
  value,
  label: CLIENT_STATUS_LABELS[value],
}))

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", STYLES[status])}>
      {CLIENT_STATUS_LABELS[status]}
    </Badge>
  )
}
