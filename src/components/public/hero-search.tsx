"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/ui/combobox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type City = { id: string; name: string; state: string }

export function HeroSearch({ cities }: { cities: City[] }) {
  const router = useRouter()
  const [purpose, setPurpose] = useState("SALE")
  const [cityId, setCityId] = useState<string>("")

  function handleSearch() {
    const params = new URLSearchParams()
    if (cityId) params.set("cityId", cityId)
    const query = params.toString()
    const base = purpose === "RENT" ? "/alugar" : "/comprar"
    router.push(query ? `${base}?${query}` : base)
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/20 bg-white/95 p-3 shadow-2xl shadow-black/20 backdrop-blur-xl sm:flex-row sm:items-center sm:p-3">
      <Select value={purpose} onValueChange={setPurpose}>
        <SelectTrigger className="h-12 border-0 bg-transparent shadow-none sm:w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="SALE">Comprar</SelectItem>
          <SelectItem value="RENT">Alugar</SelectItem>
        </SelectContent>
      </Select>

      <div className="hidden h-8 w-px bg-border sm:block" />

      <Combobox
        value={cityId}
        onValueChange={setCityId}
        placeholder="Selecione a cidade"
        searchPlaceholder="Buscar cidade..."
        emptyMessage="Nenhuma cidade encontrada."
        triggerClassName="h-12 border-0 shadow-none sm:flex-1"
        options={cities.map((city) => ({
          value: city.id,
          label: `${city.name} - ${city.state}`,
        }))}
      />

      <Button onClick={handleSearch} size="lg" className="h-12 sm:w-auto">
        <Search className="size-4" />
        Buscar imóveis
      </Button>
    </div>
  )
}
