"use client"

import { useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { SlidersHorizontal } from "lucide-react"

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
import { LEAD_ORIGIN_OPTIONS } from "@/components/admin/leads/lead-origin-badge"
import { CLIENT_TYPE_OPTIONS } from "@/components/admin/clients/client-type-badge"
import { CLIENT_STATUS_OPTIONS } from "@/components/admin/clients/client-status-badge"

type CityOption = { id: string; name: string; state: string }
type RealtorOption = { id: string; user: { name: string } }

const ALL = "__all__"

export function ClientFiltersSheet({
  cities,
  realtors,
}: {
  cities: CityOption[]
  realtors: RealtorOption[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  const activeCount = [...searchParams.keys()].filter(
    (key) => !["page", "search", "view"].includes(key)
  ).length

  function updateField(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === ALL) params.delete(key)
    else params.set(key, value)
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }

  function clearAll() {
    router.push(pathname)
    setOpen(false)
  }

  const states = [...new Set(cities.map((city) => city.state))].sort()

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
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Select
              defaultValue={searchParams.get("cityId") ?? ALL}
              onValueChange={(value) => updateField("cityId", value)}
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

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              defaultValue={searchParams.get("state") ?? ALL}
              onValueChange={(value) => updateField("state", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Qualquer estado</SelectItem>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo de cliente</Label>
            <Select
              defaultValue={searchParams.get("type") ?? ALL}
              onValueChange={(value) => updateField("type", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Qualquer tipo</SelectItem>
                {CLIENT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Origem</Label>
            <Select
              defaultValue={searchParams.get("origin") ?? ALL}
              onValueChange={(value) => updateField("origin", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Qualquer origem</SelectItem>
                {LEAD_ORIGIN_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              defaultValue={searchParams.get("status") ?? ALL}
              onValueChange={(value) => updateField("status", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Qualquer status</SelectItem>
                {CLIENT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={searchParams.get("vip") === "true"}
              onCheckedChange={(checked) => updateField("vip", checked === true ? "true" : "")}
            />
            Somente clientes VIP
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Criado de</Label>
              <Input
                type="date"
                defaultValue={searchParams.get("createdFrom") ?? ""}
                onChange={(e) => updateField("createdFrom", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Criado até</Label>
              <Input
                type="date"
                defaultValue={searchParams.get("createdTo") ?? ""}
                onChange={(e) => updateField("createdTo", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Última interação de</Label>
              <Input
                type="date"
                defaultValue={searchParams.get("lastInteractionFrom") ?? ""}
                onChange={(e) => updateField("lastInteractionFrom", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Última interação até</Label>
              <Input
                type="date"
                defaultValue={searchParams.get("lastInteractionTo") ?? ""}
                onChange={(e) => updateField("lastInteractionTo", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border/60 p-4">
          <Button variant="outline" className="w-full" onClick={clearAll}>
            Limpar tudo
          </Button>
        </div>
      </Sheet>
    </>
  )
}
