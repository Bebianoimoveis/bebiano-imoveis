"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Clock, Search, User, X } from "lucide-react"

import { suggestLeads } from "@/modules/lead/actions"

const STORAGE_KEY = "bebiano-admin:leads-buscas-recentes"

type Suggestion = { id: string; name: string; phone: string }

function readHistory(): string[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]")
  } catch {
    return []
  }
}

function pushHistory(term: string) {
  const next = [term, ...readHistory().filter((item) => item !== term)].slice(0, 5)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function LeadSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [value, setValue] = useState(searchParams.get("search") ?? "")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [history, setHistory] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => setHistory(readHistory()), [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  useEffect(() => {
    if (value.trim().length < 2) {
      setSuggestions([])
      return
    }
    const timeout = setTimeout(() => {
      suggestLeads(value).then(setSuggestions)
    }, 200)
    return () => clearTimeout(timeout)
  }, [value])

  function applySearch(term: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (term) {
      params.set("search", term)
      setHistory(pushHistory(term))
    } else {
      params.delete("search")
    }
    router.push(`${pathname}?${params.toString()}`)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && applySearch(value.trim())}
          placeholder="Buscar por nome, telefone, e-mail, imóvel, cidade, corretor…"
          className="w-full rounded-xl border border-border/60 bg-secondary/40 py-2 pr-8 pl-9 text-sm outline-none transition-colors focus:border-primary/50 focus:bg-background"
        />
        {value ? (
          <button
            type="button"
            aria-label="Limpar busca"
            onClick={() => {
              setValue("")
              applySearch("")
            }}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {open && (suggestions.length > 0 || (value.trim().length === 0 && history.length > 0)) ? (
        <div className="absolute top-full z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-2xl">
          {value.trim().length === 0 && history.length > 0 ? (
            <div className="p-2">
              <p className="px-2 py-1 text-[11px] font-medium text-muted-foreground uppercase">
                Buscas recentes
              </p>
              {history.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setValue(term)
                    applySearch(term)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-secondary"
                >
                  <Clock className="size-3.5 text-muted-foreground" />
                  {term}
                </button>
              ))}
            </div>
          ) : null}

          {suggestions.length > 0 ? (
            <div className="p-2">
              {suggestions.map((lead) => (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => {
                    setValue(lead.name)
                    applySearch(lead.name)
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-secondary"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    <User className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{lead.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{lead.phone}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
