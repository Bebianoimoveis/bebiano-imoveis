"use client"

import { useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

import { Pagination } from "@/components/shared/pagination"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const PAGE_SIZE_OPTIONS = [10, 20, 50]

// Envolve o Pagination compartilhado (usado também no site público) sem
// alterá-lo — o seletor de itens por página e o "ir para página" são só
// deste módulo admin.
export function PropertyPagination({
  page,
  pageSize,
  total,
}: {
  page: number
  pageSize: number
  total: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [jumpValue, setJumpValue] = useState("")

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // Construído aqui (não recebido via prop) porque funções não podem
  // atravessar a fronteira Server → Client Component — a página que
  // renderiza este componente é um Server Component.
  function buildHref(targetPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (targetPage > 1) params.set("page", String(targetPage))
    else params.delete("page")
    const query = params.toString()
    return query ? `${pathname}?${query}` : pathname
  }

  function updatePageSize(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("pageSize", value)
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }

  function jumpToPage() {
    const target = Number(jumpValue)
    if (!target || target < 1 || target > totalPages) return
    router.push(buildHref(target))
    setJumpValue("")
  }

  return (
    <div className="flex flex-col gap-4 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <Pagination page={page} pageSize={pageSize} total={total} buildHref={buildHref} />

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Por página</span>
          <Select defaultValue={String(pageSize)} onValueChange={updatePageSize}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center gap-2">
            <span>Ir para</span>
            <Input
              type="number"
              min={1}
              max={totalPages}
              value={jumpValue}
              onChange={(e) => setJumpValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && jumpToPage()}
              className="w-16"
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
