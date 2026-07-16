"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
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
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:flex-row sm:items-center">
      <Select value={purpose} onValueChange={setPurpose}>
        <SelectTrigger className="sm:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="SALE">Comprar</SelectItem>
          <SelectItem value="RENT">Alugar</SelectItem>
        </SelectContent>
      </Select>

      <Select value={cityId} onValueChange={setCityId}>
        <SelectTrigger className="sm:flex-1">
          <SelectValue placeholder="Selecione a cidade" />
        </SelectTrigger>
        <SelectContent>
          {cities.map((city) => (
            <SelectItem key={city.id} value={city.id}>
              {city.name} - {city.state}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={handleSearch} className="sm:w-auto">
        <Search className="size-4" />
        Buscar imóveis
      </Button>
    </div>
  )
}
