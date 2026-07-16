import { Badge } from "@/components/ui/badge"
import { PROPERTY_STATUS_LABELS } from "@/modules/property/types"
import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  IN_REVIEW: "bg-accent/30 text-accent-foreground",
  PUBLISHED: "bg-primary/10 text-primary",
  RESERVED: "bg-accent/40 text-accent-foreground",
  SOLD: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  RENTED: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  UNAVAILABLE: "bg-destructive/10 text-destructive",
  ARCHIVED: "bg-muted text-muted-foreground",
}

export function PropertyStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium", STATUS_STYLES[status])}
    >
      {PROPERTY_STATUS_LABELS[status] ?? status}
    </Badge>
  )
}
