"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useTransition } from "react"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PROPERTY_STATUS_LABELS } from "@/modules/property/types"

type City = { id: string; name: string; state: string }

const ALL = "__all__"

export function PropertyFilters({ cities }: { cities: City[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === ALL || value === "") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete("page")

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Buscar por título..."
        defaultValue={searchParams.get("search") ?? ""}
        className="w-full max-w-xs"
        onChange={(event) => updateParam("search", event.target.value)}
      />

      <Select
        defaultValue={searchParams.get("purpose") ?? ALL}
        onValueChange={(value) => updateParam("purpose", value)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Finalidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todas as finalidades</SelectItem>
          <SelectItem value="SALE">Venda</SelectItem>
          <SelectItem value="RENT">Locação</SelectItem>
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("status") ?? ALL}
        onValueChange={(value) => updateParam("status", value)}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos os status</SelectItem>
          {Object.entries(PROPERTY_STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("cityId") ?? ALL}
        onValueChange={(value) => updateParam("cityId", value)}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Cidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todas as cidades</SelectItem>
          {cities.map((city) => (
            <SelectItem key={city.id} value={city.id}>
              {city.name} - {city.state}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
