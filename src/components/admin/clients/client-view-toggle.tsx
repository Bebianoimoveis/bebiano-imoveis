import Link from "next/link"
import { LayoutGrid, List } from "lucide-react"

import { cn } from "@/lib/utils"

export function ClientViewToggle({
  view,
  buildHref,
}: {
  view: "list" | "cards"
  buildHref: (view: "list" | "cards") => string
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
        href={buildHref("cards")}
        aria-label="Modo cards"
        className={cn(
          "flex size-8 items-center justify-center rounded-lg transition-colors",
          view === "cards" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LayoutGrid className="size-4" />
      </Link>
    </div>
  )
}
