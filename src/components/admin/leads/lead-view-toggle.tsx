import Link from "next/link"
import { LayoutGrid, Table2 } from "lucide-react"

import { cn } from "@/lib/utils"

export function LeadViewToggle({ active }: { active: "kanban" | "tabela" }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border/60 p-1">
      <Link
        href="/admin/leads"
        className={cn(
          "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
          active === "kanban"
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LayoutGrid className="size-4" />
        Kanban
      </Link>
      <Link
        href="/admin/leads/tabela"
        className={cn(
          "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
          active === "tabela"
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Table2 className="size-4" />
        Tabela
      </Link>
    </div>
  )
}
