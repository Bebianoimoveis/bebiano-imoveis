import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"

function formatLabel(anchor: Date, view: "month" | "week" | "day") {
  if (view === "month") {
    return anchor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  }
  if (view === "day") {
    return anchor.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })
  }
  const start = new Date(anchor)
  start.setDate(start.getDate() - start.getDay())
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return `${start.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${end.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`
}

export function AppointmentDateNav({
  anchor,
  view,
  buildHref,
}: {
  anchor: Date
  view: "month" | "week" | "day"
  buildHref: (date: Date) => string
}) {
  const prev = new Date(anchor)
  const next = new Date(anchor)
  if (view === "month") {
    prev.setMonth(prev.getMonth() - 1)
    next.setMonth(next.getMonth() + 1)
  } else if (view === "week") {
    prev.setDate(prev.getDate() - 7)
    next.setDate(next.getDate() + 7)
  } else {
    prev.setDate(prev.getDate() - 1)
    next.setDate(next.getDate() + 1)
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="icon" className="size-8">
        <Link href={buildHref(prev)} aria-label="Anterior">
          <ChevronLeft className="size-4" />
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm" className="h-8">
        <Link href={buildHref(new Date())}>Hoje</Link>
      </Button>
      <Button asChild variant="outline" size="icon" className="size-8">
        <Link href={buildHref(next)} aria-label="Próximo">
          <ChevronRight className="size-4" />
        </Link>
      </Button>
      <p className="ml-1 text-sm font-medium capitalize">{formatLabel(anchor, view)}</p>
    </div>
  )
}
