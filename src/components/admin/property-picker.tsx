"use client"

import { useState } from "react"
import Image from "next/image"
import { ImageOff, Loader2, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/format"
import { searchPropertiesForPicker, type PropertyPickerOption } from "@/modules/property/actions"

// Campo "buscar imóvel" dos formulários: aceita o código (BB-1024) ou o
// nome do imóvel. Um resultado só → já escolhe; vários → lista com foto
// pra pessoa escolher o certo.
export function PropertyPicker({
  onSelect,
  placeholder = "Código (ex: BB-1024) ou nome do imóvel",
}: {
  onSelect: (option: PropertyPickerOption) => void
  placeholder?: string
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<PropertyPickerOption[] | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSearch() {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const found = await searchPropertiesForPicker(query)
      if (found.length === 1) {
        onSelect(found[0])
        setResults(null)
        setQuery("")
        return
      }
      setResults(found)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setResults(null)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleSearch()
            }
          }}
          placeholder={placeholder}
        />
        <Button type="button" variant="outline" className="gap-1.5" onClick={handleSearch} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Buscar
        </Button>
      </div>

      {results && results.length === 0 ? (
        <p className="text-sm text-destructive">Nenhum imóvel encontrado com esse código ou nome.</p>
      ) : null}

      {results && results.length > 1 ? (
        <div className="min-w-0 space-y-1.5">
          <p className="text-xs text-muted-foreground">
            {results.length} imóveis encontrados — escolha o desejado:
          </p>
          <div className="max-h-72 min-w-0 space-y-1.5 overflow-y-auto">
            {results.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onSelect(option)
                  setResults(null)
                  setQuery("")
                }}
                className="flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-lg border border-border/60 p-2 text-left text-sm transition-colors hover:border-primary"
              >
                <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-secondary">
                  {option.imageUrl ? (
                    <Image src={option.imageUrl} alt="" fill className="object-cover" sizes="48px" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <ImageOff className="size-4" />
                    </div>
                  )}
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{option.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {option.code}
                    {option.location ? ` · ${option.location}` : ""} · {formatCurrency(option.price)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
