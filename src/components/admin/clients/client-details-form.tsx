"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CLIENT_TYPE_OPTIONS } from "@/components/admin/clients/client-type-badge"
import { CLIENT_STATUS_OPTIONS } from "@/components/admin/clients/client-status-badge"
import { updateClient } from "@/modules/client/actions"
import type { ClientDetail } from "@/modules/client/repository"
import type { ClientStatus, ClientType } from "@/generated/prisma/client"

type RealtorOption = { id: string; user: { name: string } }
type CityOption = { id: string; name: string; state: string }

const UNASSIGNED = "__unassigned__"
const NO_CITY = "__no_city__"

const MARITAL_STATUS_OPTIONS = ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União estável"]

export function ClientDetailsForm({
  client,
  realtors,
  cities,
  onSuccess,
}: {
  client: ClientDetail
  realtors: RealtorOption[]
  cities: CityOption[]
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [realtorId, setRealtorId] = useState(client.realtorId ?? UNASSIGNED)
  const [cityId, setCityId] = useState(client.cityId ?? NO_CITY)
  const [types, setTypes] = useState<ClientType[]>(client.types)
  const [status, setStatus] = useState<ClientStatus>(client.status)
  const [vip, setVip] = useState(client.vip)
  const [tagsValue, setTagsValue] = useState(client.tags.join(", "))
  const [maritalStatus, setMaritalStatus] = useState(client.maritalStatus ?? "")

  function toggleType(type: ClientType) {
    setTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await updateClient(client.id, {
          name: String(formData.get("name") ?? "").trim(),
          phone: String(formData.get("phone") ?? "").trim(),
          email: String(formData.get("email") ?? ""),
          cpf: String(formData.get("cpf") ?? ""),
          rg: String(formData.get("rg") ?? ""),
          birthDate: formData.get("birthDate") ? new Date(String(formData.get("birthDate"))) : undefined,
          profession: String(formData.get("profession") ?? ""),
          maritalStatus,
          street: String(formData.get("street") ?? ""),
          number: String(formData.get("number") ?? ""),
          zipCode: String(formData.get("zipCode") ?? ""),
          cityId: cityId === NO_CITY ? null : cityId,
          notes: String(formData.get("notes") ?? ""),
          types,
          status,
          vip,
          tags: tagsValue
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          realtorId: realtorId === UNASSIGNED ? null : realtorId,
        })
        toast.success("Cliente atualizado.")
        router.refresh()
        onSuccess?.()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao atualizar cliente.")
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" defaultValue={client.name} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" name="phone" defaultValue={client.phone} required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" defaultValue={client.email ?? ""} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="cpf">CPF</Label>
          <Input id="cpf" name="cpf" defaultValue={client.cpf ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rg">RG</Label>
          <Input id="rg" name="rg" defaultValue={client.rg ?? ""} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="birthDate">Nascimento</Label>
          <Input
            id="birthDate"
            name="birthDate"
            type="date"
            defaultValue={client.birthDate ? client.birthDate.toISOString().slice(0, 10) : ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profession">Profissão</Label>
          <Input id="profession" name="profession" defaultValue={client.profession ?? ""} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Estado civil</Label>
        <Select value={maritalStatus || UNASSIGNED} onValueChange={(v) => setMaritalStatus(v === UNASSIGNED ? "" : v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Não informado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>Não informado</SelectItem>
            {MARITAL_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Endereço</Label>
        <div className="grid grid-cols-3 gap-3">
          <Input name="street" placeholder="Rua" defaultValue={client.street ?? ""} className="col-span-2" />
          <Input name="number" placeholder="Número" defaultValue={client.number ?? ""} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input name="zipCode" placeholder="CEP" defaultValue={client.zipCode ?? ""} />
          <Select value={cityId} onValueChange={setCityId}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_CITY}>Sem cidade</SelectItem>
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as ClientStatus)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLIENT_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>&nbsp;</Label>
          <label className="flex h-9 items-center gap-2 text-sm">
            <Checkbox checked={vip} onCheckedChange={(checked) => setVip(checked === true)} />
            <Star className="size-3.5 text-gold" />
            Cliente VIP
          </label>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
        <Input
          id="tags"
          value={tagsValue}
          onChange={(e) => setTagsValue(e.target.value)}
          placeholder="Ex: urgente, indicação"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Corretor responsável</Label>
        <Select value={realtorId} onValueChange={setRealtorId}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>Sem corretor</SelectItem>
            {realtors.map((realtor) => (
              <SelectItem key={realtor.id} value={realtor.id}>
                {realtor.user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={client.notes ?? ""} />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  )
}
