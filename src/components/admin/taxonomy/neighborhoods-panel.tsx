"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmptyState } from "@/components/shared/empty-state"
import { NeighborhoodFormDialog } from "@/components/admin/taxonomy/neighborhood-form-dialog"
import { listNeighborhoods } from "@/modules/taxonomy/actions"

type CityOption = { id: string; name: string; state: string }
type NeighborhoodItem = { id: string; name: string }

export function NeighborhoodsPanel({ cities }: { cities: CityOption[] }) {
  const [cityId, setCityId] = useState(cities[0]?.id ?? "")
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodItem[]>([])
  const [loading, setLoading] = useState(false)

  function refetch(id: string) {
    if (!id) {
      setNeighborhoods([])
      return
    }
    setLoading(true)
    listNeighborhoods(id)
      .then(setNeighborhoods)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refetch(cityId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId])

  if (cities.length === 0) {
    return (
      <EmptyState
        title="Cadastre uma cidade primeiro"
        description="Bairros ficam vinculados a uma cidade — crie a cidade acima antes de adicionar bairros."
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select value={cityId} onValueChange={setCityId}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.id}>
                {city.name} - {city.state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <NeighborhoodFormDialog
          cityId={cityId}
          onCreated={() => refetch(cityId)}
          trigger={
            <Button size="sm" disabled={!cityId}>
              <Plus className="size-4" /> Novo bairro
            </Button>
          }
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : neighborhoods.length === 0 ? (
        <EmptyState title="Nenhum bairro cadastrado nessa cidade" />
      ) : (
        <div className="flex flex-wrap gap-2">
          {neighborhoods.map((neighborhood) => (
            <span
              key={neighborhood.id}
              className="rounded-full border border-border/60 bg-secondary/40 px-3 py-1.5 text-sm"
            >
              {neighborhood.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
