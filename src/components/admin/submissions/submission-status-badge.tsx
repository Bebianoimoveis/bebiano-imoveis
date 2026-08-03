import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type SubmissionStatus = "NEW" | "CONTACTED" | "CONVERTED" | "DECLINED"

const STYLES: Record<SubmissionStatus, string> = {
  NEW: "bg-blue-500/10 text-blue-500",
  CONTACTED: "bg-amber-500/10 text-amber-500",
  CONVERTED: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  DECLINED: "bg-muted text-muted-foreground",
}

const LABELS: Record<SubmissionStatus, string> = {
  NEW: "Novo",
  CONTACTED: "Contactado",
  CONVERTED: "Convertido",
  DECLINED: "Recusado",
}

export const SUBMISSION_STATUS_OPTIONS = (
  ["NEW", "CONTACTED", "CONVERTED", "DECLINED"] as SubmissionStatus[]
).map((value) => ({ value, label: LABELS[value] }))

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", STYLES[status])}>
      {LABELS[status]}
    </Badge>
  )
}
