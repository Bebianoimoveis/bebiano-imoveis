"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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
import { createClientManually } from "@/modules/client/actions"
import type { ClientType } from "@/generated/prisma/client"

type RealtorOption = { id: string; user: { name: string } }
type CityOption = { id: string; name: string; state: string }

const NONE = "__none__"

export function ClientCreateSheet({
  open,
  onOpenChange,
  realtors,
  cities,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  realtors: RealtorOption[]
  cities: CityOption[]
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [origin, setOrigin] = useState("site")
  const [types, setTypes] = useState<ClientType[]>([])
  const [vip, setVip] = useState(false)
  const [realtorId, setRealtorId] = useState(NONE)
  const [cityId, setCityId] = useState(NONE)

  function reset() {
    setName("")
    setPhone("")
    setEmail("")
    setOrigin("site")
    setTypes([])
    setVip(false)
    setRealtorId(NONE)
    setCityId(NONE)
  }

  function toggleType(type: ClientType) {
    setTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  async function handleSubmit() {
    if (!name.trim() || !phone.trim()) {
      toast.error("Informe nome e telefone.")
      return
    }

    setIsSubmitting(true)
    try {
      await createClientManually({
        name,
        phone,
        email,
        origin,
        types,
        vip,
        realtorId: realtorId === NONE ? undefined : realtorId,
        cityId: cityId === NONE ? undefined : cityId,
      })
      toast.success("Cliente cadastrado.")
      reset()
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao cadastrar cliente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right" title="Novo Cliente">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div className="space-y-1.5">
          <Label>Nome</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="opcional" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Origem</Label>
            <Select value={origin} onValueChange={setOrigin}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_ORIGIN_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Cidade</Label>
            <Select value={cityId} onValueChange={setCityId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sem cidade</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name} - {city.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Corretor responsável</Label>
          <Select value={realtorId} onValueChange={setRealtorId}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Sem corretor</SelectItem>
              {realtors.map((realtor) => (
                <SelectItem key={realtor.id} value={realtor.id}>
                  {realtor.user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Tipo de cliente</Label>
          <div className="flex flex-wrap gap-3">
            {CLIENT_TYPE_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-1.5 text-sm">
                <Checkbox
                  checked={types.includes(option.value as ClientType)}
                  onCheckedChange={() => toggleType(option.value as ClientType)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={vip} onCheckedChange={(checked) => setVip(checked === true)} />
          Marcar como VIP
        </label>

        <p className="text-xs text-muted-foreground">
          CPF, RG, endereço e demais dados do perfil podem ser preenchidos depois, na aba
          &ldquo;Visão Geral&rdquo; do cliente.
        </p>
      </div>

      <div className="border-t border-border/60 p-4">
        <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Cadastrar cliente"}
        </Button>
      </div>
    </Sheet>
  )
}
