import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ClientType } from "@/generated/prisma/client"

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  BUYER: "Comprador",
  SELLER: "Vendedor",
  TENANT: "Locatário",
  INVESTOR: "Investidor",
}

const STYLES: Record<ClientType, string> = {
  BUYER: "bg-blue-500/10 text-blue-500",
  SELLER: "bg-amber-500/10 text-amber-500",
  TENANT: "bg-violet-500/10 text-violet-500",
  INVESTOR: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
}

export const CLIENT_TYPE_OPTIONS = (Object.keys(CLIENT_TYPE_LABELS) as ClientType[]).map((value) => ({
  value,
  label: CLIENT_TYPE_LABELS[value],
}))

export function ClientTypeBadge({ type }: { type: ClientType }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", STYLES[type])}>
      {CLIENT_TYPE_LABELS[type]}
    </Badge>
  )
}
