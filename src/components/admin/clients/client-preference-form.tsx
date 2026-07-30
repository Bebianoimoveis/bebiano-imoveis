"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { saveClientPreference } from "@/modules/client/actions"
import { listNeighborhoods } from "@/modules/taxonomy/actions"
import type { ClientDetail } from "@/modules/client/repository"
import type { Purpose } from "@/generated/prisma/client"

type CityOption = { id: string; name: string; state: string }
type PropertyTypeOption = { id: string; name: string }
type NeighborhoodOption = { id: string; name: string }

const NONE = "__none__"

export function ClientPreferenceForm({
  clientId,
  preference,
  cities,
  propertyTypes,
  onSuccess,
}: {
  clientId: string
  preference: ClientDetail["preference"]
  cities: CityOption[]
  propertyTypes: PropertyTypeOption[]
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [propertyTypeId, setPropertyTypeId] = useState(preference?.propertyTypeId ?? NONE)
  const [purpose, setPurpose] = useState<Purpose | typeof NONE>(preference?.purpose ?? NONE)
  const [cityId, setCityId] = useState(preference?.cityId ?? NONE)
  const [neighborhoodId, setNeighborhoodId] = useState(preference?.neighborhoodId ?? NONE)
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodOption[]>([])
  const [pool, setPool] = useState(preference?.pool ?? false)
  const [gatedCommunity, setGatedCommunity] = useState(preference?.gatedCommunity ?? false)
  const [acceptsFinancing, setAcceptsFinancing] = useState(preference?.acceptsFinancing ?? false)

  useEffect(() => {
    if (cityId !== NONE) {
      listNeighborhoods(cityId).then(setNeighborhoods)
    } else {
      setNeighborhoods([])
    }
  }, [cityId])

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await saveClientPreference(clientId, {
          propertyTypeId: propertyTypeId === NONE ? null : propertyTypeId,
          purpose: purpose === NONE ? null : purpose,
          minValue: formData.get("minValue") ? Number(formData.get("minValue")) : null,
          maxValue: formData.get("maxValue") ? Number(formData.get("maxValue")) : null,
          cityId: cityId === NONE ? null : cityId,
          neighborhoodId: neighborhoodId === NONE ? null : neighborhoodId,
          bedrooms: formData.get("bedrooms") ? Number(formData.get("bedrooms")) : null,
          minArea: formData.get("minArea") ? Number(formData.get("minArea")) : null,
          pool,
          gatedCommunity,
          acceptsFinancing,
        })
        toast.success("Preferências salvas.")
        router.refresh()
        onSuccess?.()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao salvar preferências.")
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Tipo de imóvel</Label>
          <Select value={propertyTypeId} onValueChange={setPropertyTypeId}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Qualquer tipo</SelectItem>
              {propertyTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Finalidade</Label>
          <Select value={purpose} onValueChange={(v) => setPurpose(v as Purpose)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Qualquer</SelectItem>
              <SelectItem value="SALE">Compra</SelectItem>
              <SelectItem value="RENT">Locação</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="minValue">Valor mín.</Label>
          <Input id="minValue" name="minValue" type="number" step="0.01" defaultValue={preference?.minValue?.toString() ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="maxValue">Valor máx.</Label>
          <Input id="maxValue" name="maxValue" type="number" step="0.01" defaultValue={preference?.maxValue?.toString() ?? ""} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Cidade</Label>
          <Select value={cityId} onValueChange={(v) => { setCityId(v); setNeighborhoodId(NONE) }}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Qualquer cidade</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  {city.name} - {city.state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Bairro</Label>
          <Select value={neighborhoodId} onValueChange={setNeighborhoodId} disabled={neighborhoods.length === 0}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={neighborhoods.length === 0 ? "Selecione uma cidade" : undefined} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Qualquer bairro</SelectItem>
              {neighborhoods.map((neighborhood) => (
                <SelectItem key={neighborhood.id} value={neighborhood.id}>
                  {neighborhood.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="bedrooms">Dormitórios (mín.)</Label>
          <Input id="bedrooms" name="bedrooms" type="number" defaultValue={preference?.bedrooms ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="minArea">Área (m², mín.)</Label>
          <Input id="minArea" name="minArea" type="number" step="0.01" defaultValue={preference?.minArea?.toString() ?? ""} />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={pool} onCheckedChange={(c) => setPool(c === true)} />
          Piscina
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={gatedCommunity} onCheckedChange={(c) => setGatedCommunity(c === true)} />
          Condomínio fechado
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={acceptsFinancing} onCheckedChange={(c) => setAcceptsFinancing(c === true)} />
          Aceita financiamento
        </label>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar preferências"}
      </Button>
    </form>
  )
}
