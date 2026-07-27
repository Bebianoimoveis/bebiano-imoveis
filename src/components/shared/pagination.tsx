import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type PaginationProps = {
  page: number
  pageSize: number
  total: number
  buildHref: (page: number) => string
}

// Números de página com reticências quando há muitas páginas: sempre
// mostra a primeira, a última, a atual e uma vizinhança ao redor dela.
function getPageNumbers(current: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages = new Set<number>([1, totalPages, current, current - 1, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)

  const result: (number | "ellipsis")[] = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("ellipsis")
    result.push(sorted[i])
  }
  return result
}

export function Pagination({ page, pageSize, total, buildHref }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  const pageNumbers = getPageNumbers(page, totalPages)

  return (
    <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground sm:flex-row sm:justify-between">
      <p>
        Página {page} de {totalPages} · {total} imóveis
      </p>
      <div className="flex items-center gap-1.5">
        {page <= 1 ? (
          <Button variant="outline" size="icon" disabled>
            <ChevronLeft className="size-4" />
          </Button>
        ) : (
          <Button variant="outline" size="icon" asChild>
            <Link href={buildHref(page - 1)} aria-label="Página anterior">
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
        )}

        {pageNumbers.map((item, index) =>
          item === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className="px-1.5 text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={item}
              variant={item === page ? "default" : "outline"}
              size="icon"
              asChild={item !== page}
              disabled={item === page}
              className={cn(item === page && "pointer-events-none")}
            >
              {item === page ? (
                <span>{item}</span>
              ) : (
                <Link href={buildHref(item)} aria-label={`Página ${item}`}>
                  {item}
                </Link>
              )}
            </Button>
          )
        )}

        {page >= totalPages ? (
          <Button variant="outline" size="icon" disabled>
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button variant="outline" size="icon" asChild>
            <Link href={buildHref(page + 1)} aria-label="Próxima página">
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
