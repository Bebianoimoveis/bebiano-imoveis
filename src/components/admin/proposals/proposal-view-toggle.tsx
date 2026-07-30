import Link from "next/link"
import { Columns3, Table2 } from "lucide-react"

import { cn } from "@/lib/utils"

export function ProposalViewToggle({
  view,
  buildHref,
}: {
  view: "table" | "pipeline"
  buildHref: (view: "table" | "pipeline") => string
}) {
  return (
    <div className="flex items-center rounded-xl border border-border/60 bg-secondary/30 p-1">
      <Link
        href={buildHref("table")}
        aria-label="Tabela"
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors",
          view === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Table2 className="size-3.5" /> Tabela
      </Link>
      <Link
        href={buildHref("pipeline")}
        aria-label="Pipeline"
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors",
          view === "pipeline" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Columns3 className="size-3.5" /> Pipeline
      </Link>
    </div>
  )
}
