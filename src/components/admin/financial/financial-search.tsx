"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useTransition } from "react"
import { Search } from "lucide-react"

export function FinancialSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set("search", value)
    else params.delete("search")
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  return (
    <div className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        defaultValue={searchParams.get("search") ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Buscar por categoria, cliente, corretor ou imóvel…"
        className="w-full rounded-xl border border-border/60 bg-secondary/40 py-2 pr-3 pl-9 text-sm outline-none transition-colors focus:border-primary/50 focus:bg-background"
      />
    </div>
  )
}
