import type { PropertyListItem } from "@/modules/property/repository"

export type PropertyWithMetrics = PropertyListItem & {
  leadCount: number
  lastVisitAt: Date | null
}
