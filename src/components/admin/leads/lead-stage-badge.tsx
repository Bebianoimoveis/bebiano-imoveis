import { Badge } from "@/components/ui/badge"
import { LEAD_STAGE_LABELS } from "@/components/admin/leads/lead-stage"
import type { LeadStage } from "@/generated/prisma/client"

const CLOSED_STYLES: Partial<Record<LeadStage, string>> = {
  CLOSED: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  LOST: "bg-destructive/10 text-destructive",
}

export function LeadStageBadge({ stage }: { stage: LeadStage }) {
  return (
    <Badge variant="outline" className={CLOSED_STYLES[stage]}>
      {LEAD_STAGE_LABELS[stage]}
    </Badge>
  )
}
