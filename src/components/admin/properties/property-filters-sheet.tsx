"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { SlidersHorizontal, Star, Bookmark, X } from "lucide-react"

import { Sheet } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PROPERTY_STATUS_LABELS } from "@/modules/property/types"
import { listNeighborhoods } from "@/modules/taxonomy/actions"

type Option = { id: string; name: string }
type CityOption = Option & { state: string }
type RealtorOption = { id: string; user: { name: string } }

const ALL = "__all__"
const STORAGE_KEY = "bebiano-admin:imoveis-filtros-salvos"

const CHECKBOX_FIELDS: { key: string; label: string }[] = [
  { key: "acceptsFinancing", label: "Aceita financiamento" },
  { key: "acceptsFgts", label: "Aceita FGTS" },
  { key: "furnished", label: "Mobiliado" },
  { key: "gatedCommunity", label: "Condomínio fechado" },
  { key: "featured", label: "Em destaque" },
]

type SavedFilter = { name: string; query: string }

function readSavedFilters(): SavedFilter[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]")
  } catch {
    return []
  }
}

export function PropertyFiltersSheet({
  cities,
  propertyTypes,
  realtors,
}: {
  cities: CityOption[]
  propertyTypes: Option[]
  realtors: RealtorOption[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [neighborhoods, setNeighborhoods] = useState<Option[]>([])
  const [saved, setSaved] = useState<SavedFilter[]>([])

  useEffect(() => {
    setSaved(readSavedFilters())
  }, [])

  useEffect(() => {
    const cityId = searchParams.get("cityId")
    if (cityId) {
      listNeighborhoods(cityId).then(setNeighborhoods)
    } else {
      setNeighborhoods([])
    }
  }, [searchParams])

  const activeCount = [...searchParams.keys()].filter(
    (key) => !["page", "search", "status", "cityId", "view"].includes(key)
  ).length

  function apply(params: URLSearchParams) {
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }

  function updateField(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === ALL) params.delete(key)
    else params.set(key, value)
    apply(params)
  }

  function updateCheckbox(key: string, checked: boolean) {
    const params = new URLSearchParams(searchParams.toString())
    if (checked) params.set(key, "true")
    else params.delete(key)
    apply(params)
  }

  function clearAll() {
    router.push(pathname)
    setOpen(false)
  }

  function saveCurrent() {
    const name = window.prompt("Nome para este filtro:")
    if (!name) return
    const next = [...saved, { name, query: searchParams.toString() }]
    setSaved(next)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function removeSaved(index: number) {
    const next = saved.filter((_, i) => i !== index)
    setSaved(next)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <SlidersHorizontal className="size-4" />
        Filtros
        {activeCount > 0 ? (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
            {activeCount}
          </span>
        ) : null}
      </Button>

      <Sheet open={open} onOpenChange={setOpen} side="right" title="Filtros avançados">
        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {saved.length > 0 ? (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase">
                <Bookmark className="size-3.5" /> Filtros salvos
              </Label>
              <div className="flex flex-wrap gap-2">
                {saved.map((filter, index) => (
                  <span
                    key={filter.name}
                    className="flex items-center gap-1 rounded-full border border-border/60 bg-secondary/40 py-1 pr-1 pl-3 text-xs"
                  >
                    <button type="button" onClick={() => apply(new URLSearchParams(filter.query))}>
                      {filter.name}
                    </button>
                    <button
                      type="button"
                      aria-label="Remover filtro salvo"
                      onClick={() => removeSaved(index)}
                      className="flex size-4 items-center justify-center rounded-full hover:bg-secondary"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Tipo de imóvel</Label>
            <Select
              defaultValue={searchParams.get("typeId") ?? ALL}
              onValueChange={(value) => updateField("typeId", value)}
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
            <Label>Bairro</Label>
            <Select
              defaultValue={searchParams.get("neighborhoodId") ?? ALL}
              onValueChange={(value) => updateField("neighborhoodId", value)}
              disabled={neighborhoods.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={neighborhoods.length === 0 ? "Selecione uma cidade primeiro" : undefined} />
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

          <div className="space-y-2">
            <Label>Corretor</Label>
            <Select
              defaultValue={searchParams.get("realtorId") ?? ALL}
              onValueChange={(value) => updateField("realtorId", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Qualquer corretor</SelectItem>
                {realtors.map((realtor) => (
                  <SelectItem key={realtor.id} value={realtor.id}>
                    {realtor.user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Valor mín.</Label>
              <Input
                type="number"
                defaultValue={searchParams.get("minPrice") ?? ""}
                onChange={(e) => updateField("minPrice", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor máx.</Label>
              <Input
                type="number"
                defaultValue={searchParams.get("maxPrice") ?? ""}
                onChange={(e) => updateField("maxPrice", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Área mínima (m²)</Label>
            <Input
              type="number"
              defaultValue={searchParams.get("minArea") ?? ""}
              onChange={(e) => updateField("minArea", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Dormitórios</Label>
              <Input
                type="number"
                min={0}
                defaultValue={searchParams.get("bedrooms") ?? ""}
                onChange={(e) => updateField("bedrooms", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Suítes</Label>
              <Input
                type="number"
                min={0}
                defaultValue={searchParams.get("suites") ?? ""}
                onChange={(e) => updateField("suites", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Vagas</Label>
              <Input
                type="number"
                min={0}
                defaultValue={searchParams.get("parkingSpots") ?? ""}
                onChange={(e) => updateField("parkingSpots", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Cadastrado de</Label>
              <Input
                type="date"
                defaultValue={searchParams.get("createdFrom") ?? ""}
                onChange={(e) => updateField("createdFrom", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Cadastrado até</Label>
              <Input
                type="date"
                defaultValue={searchParams.get("createdTo") ?? ""}
                onChange={(e) => updateField("createdTo", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            {CHECKBOX_FIELDS.map((field) => (
              <label key={field.key} className="flex items-center gap-2 text-sm">
                <Checkbox
                  defaultChecked={searchParams.get(field.key) === "true"}
                  onCheckedChange={(checked) => updateCheckbox(field.key, checked === true)}
                />
                {field.key === "featured" ? <Star className="size-3.5 text-gold" /> : null}
                {field.label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2 border-t border-border/60 p-4">
          <Button variant="outline" className="flex-1" onClick={clearAll}>
            Limpar tudo
          </Button>
          <Button variant="outline" className="flex-1 gap-1.5" onClick={saveCurrent}>
            <Bookmark className="size-4" />
            Salvar filtro
          </Button>
        </div>
      </Sheet>
    </>
  )
}
