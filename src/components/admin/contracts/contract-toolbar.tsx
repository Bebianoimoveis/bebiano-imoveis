"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Loader2, Search, X } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CONTRACT_STATUS_LABELS } from "@/components/admin/contracts/contract-status-badge"
import { cn } from "@/lib/utils"

const ALL = "__all__"
const STATUS_ORDER = ["DRAFT", "ACTIVE", "COMPLETED", "CANCELED"] as const

export function ContractToolbar({
  realtors,
  statusCounts,
}: {
  realtors: { id: string; name: string }[]
  statusCounts: Record<string, number>
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [text, setText] = useState(searchParams.get("busca") ?? "")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const status = searchParams.get("status") ?? ""
  const realtor = searchParams.get("corretor") ?? ""

  function update(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    const query = params.toString()
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }))
  }

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  function handleText(value: string) {
    setText(value)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => update({ busca: value.trim() || null }), 350)
  }

  const total = Object.values(statusCounts).reduce((sum, n) => sum + n, 0)

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={text}
            onChange={(e) => handleText(e.target.value)}
            placeholder="Buscar cliente (nome, CPF, RG, telefone) ou imóvel…"
            className="w-full rounded-xl border border-border/60 bg-card py-2.5 pr-9 pl-9 text-sm outline-none transition-colors focus:border-primary/50"
          />
          {isPending ? (
            <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : text ? (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={() => handleText("")}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        {realtors.length > 1 ? (
          <Select value={realtor || ALL} onValueChange={(v) => update({ corretor: v === ALL ? null : v })}>
            <SelectTrigger className="w-full bg-card sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os corretores</SelectItem>
              {realtors.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[{ value: "", label: "Todos", count: total }, ...STATUS_ORDER.map((s) => ({ value: s, label: CONTRACT_STATUS_LABELS[s], count: statusCounts[s] ?? 0 }))].map(
          (chip) => (
            <button
              key={chip.value || "all"}
              type="button"
              onClick={() => update({ status: chip.value || null })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                status === chip.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {chip.label} <span className="opacity-70">({chip.count})</span>
            </button>
          )
        )}
      </div>
    </div>
  )
}
