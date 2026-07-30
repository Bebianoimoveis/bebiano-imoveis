"use client"

import { useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { SlidersHorizontal } from "lucide-react"

import { Sheet } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FINANCIAL_STATUS_OPTIONS } from "@/components/admin/financial/financial-entry-status-badge"
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/modules/financial/schema"

type CityOption = { id: string; name: string; state: string }
type RealtorOption = { id: string; user: { name: string } }

const ALL = "__all__"
const ALL_CATEGORIES = Array.from(new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]))

const PAYMENT_METHOD_OPTIONS = [
  { value: "PIX", label: "PIX" },
  { value: "TED", label: "TED" },
  { value: "CARD", label: "Cartão" },
  { value: "CASH", label: "Dinheiro" },
  { value: "BOLETO", label: "Boleto" },
  { value: "TRANSFER", label: "Transferência" },
  { value: "CHECK", label: "Cheque" },
]

export function FinancialFiltersSheet({
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

  const activeCount = [...searchParams.keys()].filter((key) => !["page", "search", "tab"].includes(key)).length

  function updateField(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === ALL) params.delete(key)
    else params.set(key, value)
    router.push(`${pathname}?${params.toString()}`)
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString())
    const tab = params.get("tab")
    router.push(tab ? `${pathname}?tab=${tab}` : pathname)
    setOpen(false)
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
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select defaultValue={searchParams.get("type") ?? ALL} onValueChange={(v) => updateField("type", v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Receita e despesa</SelectItem>
                <SelectItem value="INCOME">Receita</SelectItem>
                <SelectItem value="EXPENSE">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select defaultValue={searchParams.get("category") ?? ALL} onValueChange={(v) => updateField("category", v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Qualquer categoria</SelectItem>
                {ALL_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select defaultValue={searchParams.get("status") ?? ALL} onValueChange={(v) => updateField("status", v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Qualquer status</SelectItem>
                {FINANCIAL_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Corretor</Label>
            <Select defaultValue={searchParams.get("realtorId") ?? ALL} onValueChange={(v) => updateField("realtorId", v)}>
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
            <Label>Cidade do imóvel</Label>
            <Select defaultValue={searchParams.get("cityId") ?? ALL} onValueChange={(v) => updateField("cityId", v)}>
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
            <Label>Forma de pagamento</Label>
            <Select
              defaultValue={searchParams.get("paymentMethod") ?? ALL}
              onValueChange={(v) => updateField("paymentMethod", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Qualquer forma</SelectItem>
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Vencimento de</Label>
              <Input type="date" defaultValue={searchParams.get("from") ?? ""} onChange={(e) => updateField("from", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Vencimento até</Label>
              <Input type="date" defaultValue={searchParams.get("to") ?? ""} onChange={(e) => updateField("to", e.target.value)} />
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
