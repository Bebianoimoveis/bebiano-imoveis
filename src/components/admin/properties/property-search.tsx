"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Building2, Clock, Search, X } from "lucide-react"

import { suggestProperties } from "@/modules/property/actions"

const STORAGE_KEY = "bebiano-admin:imoveis-buscas-recentes"

type Suggestion = { id: string; code: string; title: string; city: { name: string } }

function readHistory(): string[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]")
  } catch {
    return []
  }
}

function pushHistory(term: string) {
  const current = readHistory().filter((item) => item !== term)
  const next = [term, ...current].slice(0, 5)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function PropertySearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [value, setValue] = useState(searchParams.get("search") ?? "")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [history, setHistory] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setHistory(readHistory())
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
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
      suggestProperties(value).then(setSuggestions as (r: Awaited<ReturnType<typeof suggestProperties>>) => void)
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
    params.delete("page")
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
          onKeyDown={(e) => {
            if (e.key === "Enter") applySearch(value.trim())
          }}
          placeholder="Buscar por título, código, cidade, bairro, corretor…"
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
              {suggestions.map((property) => (
                <button
                  key={property.id}
                  type="button"
                  onClick={() => {
                    setValue(property.title)
                    applySearch(property.title)
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-secondary"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    <Building2 className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{property.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {property.code} · {property.city.name}
                    </span>
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
