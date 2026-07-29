import Link from "next/link"
import { LayoutGrid, List } from "lucide-react"

import { cn } from "@/lib/utils"

// Mesmo espírito do LeadViewToggle (server-driven via Link, não estado
// client) — aqui como parâmetro `?view=` em vez de rotas separadas, já
// que os filtros continuam os mesmos nos dois modos.
export function PropertyViewToggle({
  view,
  buildHref,
}: {
  view: "list" | "grid"
  buildHref: (view: "list" | "grid") => string
}) {
  return (
    <div className="flex items-center rounded-xl border border-border/60 bg-secondary/30 p-1">
      <Link
        href={buildHref("list")}
        aria-label="Modo lista"
        className={cn(
          "flex size-8 items-center justify-center rounded-lg transition-colors",
          view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <List className="size-4" />
      </Link>
      <Link
        href={buildHref("grid")}
        aria-label="Modo cards"
        className={cn(
          "flex size-8 items-center justify-center rounded-lg transition-colors",
          view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LayoutGrid className="size-4" />
      </Link>
    </div>
  )
}
