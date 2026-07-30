"use client"

import { useEffect, useState } from "react"
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
import { LEAD_TEMPERATURE_OPTIONS } from "@/components/admin/leads/lead-temperature-badge"
import { LEAD_STAGE_LABELS, LEAD_STAGE_ORDER } from "@/components/admin/leads/lead-stage"
import { createLeadManually } from "@/modules/lead/actions"
import { findPropertyByCode } from "@/modules/property/actions"
import type { LeadStage, LeadTemperature } from "@/generated/prisma/client"

type RealtorOption = { id: string; user: { name: string } }

const NONE = "__none__"

export function LeadCreateSheet({
  stage,
  onOpenChange,
  realtors,
}: {
  stage: LeadStage | null
  onOpenChange: (open: boolean) => void
  realtors: RealtorOption[]
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [origin, setOrigin] = useState("site")
  const [temperature, setTemperature] = useState<LeadTemperature>("WARM")
  const [vip, setVip] = useState(false)
  const [realtorId, setRealtorId] = useState(NONE)
  const [selectedStage, setSelectedStage] = useState<LeadStage>("NEW")
  const [propertyCode, setPropertyCode] = useState("")
  const [resolvedProperty, setResolvedProperty] = useState<{ id: string; title: string } | null>(null)

  useEffect(() => {
    if (stage) setSelectedStage(stage)
  }, [stage])

  function reset() {
    setName("")
    setPhone("")
    setEmail("")
    setOrigin("site")
    setTemperature("WARM")
    setVip(false)
    setRealtorId(NONE)
    setPropertyCode("")
    setResolvedProperty(null)
  }

  async function handleLookupProperty() {
    const property = await findPropertyByCode(propertyCode.trim())
    setResolvedProperty(property ? { id: property.id, title: property.title } : null)
    if (!property) toast.error("Imóvel não encontrado com esse código.")
  }

  async function handleSubmit() {
    if (!name.trim() || !phone.trim()) {
      toast.error("Informe nome e telefone.")
      return
    }

    setIsSubmitting(true)
    try {
      await createLeadManually({
        name,
        phone,
        email,
        origin,
        temperature,
        vip,
        stage: selectedStage,
        realtorId: realtorId === NONE ? undefined : realtorId,
        propertyId: resolvedProperty?.id,
      })
      toast.success("Lead cadastrado.")
      reset()
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao cadastrar lead.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={!!stage} onOpenChange={onOpenChange} side="right" title="Novo Lead">
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
            <Label>Temperatura</Label>
            <Select value={temperature} onValueChange={(v) => setTemperature(v as LeadTemperature)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_TEMPERATURE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Etapa inicial</Label>
          <Select value={selectedStage} onValueChange={(v) => setSelectedStage(v as LeadStage)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEAD_STAGE_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {LEAD_STAGE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Label>Imóvel de interesse (opcional)</Label>
          <div className="flex gap-2">
            <Input
              value={propertyCode}
              onChange={(e) => setPropertyCode(e.target.value)}
              placeholder="Ex: BB-1024"
            />
            <Button type="button" variant="outline" onClick={handleLookupProperty}>
              Buscar
            </Button>
          </div>
          {resolvedProperty ? (
            <p className="text-sm text-primary">{resolvedProperty.title}</p>
          ) : null}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={vip} onCheckedChange={(checked) => setVip(checked === true)} />
          Marcar como VIP
        </label>
      </div>

      <div className="border-t border-border/60 p-4">
        <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Cadastrar lead"}
        </Button>
      </div>
    </Sheet>
  )
}
