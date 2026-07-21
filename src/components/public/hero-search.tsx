"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/ui/combobox"

type City = { id: string; name: string; state: string }

export function HeroSearch({ cities }: { cities: City[] }) {
  const router = useRouter()
  const [cityId, setCityId] = useState<string>("")

  function handleSearch() {
    const params = new URLSearchParams()
    if (cityId) params.set("cityId", cityId)
    const query = params.toString()
    router.push(query ? `/comprar?${query}` : "/comprar")
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/20 bg-white/95 p-3 shadow-2xl shadow-black/20 backdrop-blur-xl sm:flex-row sm:items-center sm:p-3">
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
