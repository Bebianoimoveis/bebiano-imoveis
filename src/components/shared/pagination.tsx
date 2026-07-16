import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"

type PaginationProps = {
  page: number
  pageSize: number
  total: number
  buildHref: (page: number) => string
}

export function Pagination({ page, pageSize, total, buildHref }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <p>
        Página {page} de {totalPages} · {total} imóveis
      </p>
      <div className="flex items-center gap-2">
        {page <= 1 ? (
          <Button variant="outline" size="icon" disabled>
            <ChevronLeft className="size-4" />
          </Button>
        ) : (
          <Button variant="outline" size="icon" asChild>
            <Link href={buildHref(page - 1)}>
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
        )}
        {page >= totalPages ? (
          <Button variant="outline" size="icon" disabled>
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button variant="outline" size="icon" asChild>
            <Link href={buildHref(page + 1)}>
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
