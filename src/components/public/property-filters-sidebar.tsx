"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState, useTransition } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { listNeighborhoods } from "@/modules/taxonomy/actions"

type Option = { id: string; name: string }
type CityOption = Option & { state: string }

const ALL = "__all__"
const BEDROOM_OPTIONS = [1, 2, 3, 4]

const CHECKBOX_FILTERS: { key: string; label: string }[] = [
  { key: "acceptsFinancing", label: "Aceita financiamento" },
  { key: "acceptsFgts", label: "Aceita FGTS" },
  { key: "furnished", label: "Mobiliado" },
  { key: "gatedCommunity", label: "Condomínio fechado" },
]

export function PropertyFiltersSidebar({
  cities,
  propertyTypes,
}: {
  cities: CityOption[]
  propertyTypes: Option[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [neighborhoods, setNeighborhoods] = useState<Option[]>([])

  function updateParams(entries: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(entries)) {
      if (!value || value === ALL) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }
    params.delete("page")

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  async function handleCityChange(cityId: string) {
    updateParams({ cityId, neighborhoodId: undefined })
    if (cityId === ALL) {
      setNeighborhoods([])
      return
    }
    setNeighborhoods(await listNeighborhoods(cityId))
  }

  return (
    <div className="space-y-6 rounded-xl border border-border/60 bg-card p-5">
      <div className="space-y-2">
        <Label>Buscar por título</Label>
        <Input
          defaultValue={searchParams.get("search") ?? ""}
          placeholder="Ex: apartamento no centro"
          onChange={(e) => updateParams({ search: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Código do imóvel</Label>
        <Input
          defaultValue={searchParams.get("code") ?? ""}
          placeholder="Ex: BB-1024"
          onChange={(e) => updateParams({ code: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Tipo de imóvel</Label>
        <Select
          defaultValue={searchParams.get("typeId") ?? ALL}
          onValueChange={(value) => updateParams({ typeId: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Qualquer tipo</SelectItem>
            {propertyTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Cidade</Label>
        <Select
          defaultValue={searchParams.get("cityId") ?? ALL}
          onValueChange={handleCityChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Qualquer cidade</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.id}>
                {city.name} - {city.state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {neighborhoods.length > 0 ? (
        <div className="space-y-2">
          <Label>Bairro</Label>
          <Select
            defaultValue={searchParams.get("neighborhoodId") ?? ALL}
            onValueChange={(value) => updateParams({ neighborhoodId: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Qualquer bairro</SelectItem>
              {neighborhoods.map((neighborhood) => (
                <SelectItem key={neighborhood.id} value={neighborhood.id}>
                  {neighborhood.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Valor mín.</Label>
          <Input
            type="number"
            defaultValue={searchParams.get("minPrice") ?? ""}
            onChange={(e) => updateParams({ minPrice: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Valor máx.</Label>
          <Input
            type="number"
            defaultValue={searchParams.get("maxPrice") ?? ""}
            onChange={(e) => updateParams({ maxPrice: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Quartos (mínimo)</Label>
        <Select
          defaultValue={searchParams.get("bedrooms") ?? ALL}
          onValueChange={(value) => updateParams({ bedrooms: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Qualquer</SelectItem>
            {BEDROOM_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}+
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Área mínima (m²)</Label>
        <Input
          type="number"
          defaultValue={searchParams.get("minArea") ?? ""}
          onChange={(e) => updateParams({ minArea: e.target.value })}
        />
      </div>

      <div className="space-y-3">
        {CHECKBOX_FILTERS.map((filter) => (
          <label key={filter.key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded border-border"
              defaultChecked={searchParams.get(filter.key) === "true"}
              onChange={(e) =>
                updateParams({ [filter.key]: e.target.checked ? "true" : undefined })
              }
            />
            {filter.label}
          </label>
        ))}
      </div>
    </div>
  )
}
