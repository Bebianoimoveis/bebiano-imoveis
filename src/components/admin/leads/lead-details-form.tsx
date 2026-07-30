"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LEAD_TEMPERATURE_OPTIONS } from "@/components/admin/leads/lead-temperature-badge"
import { updateLead } from "@/modules/lead/actions"
import type { LeadTemperature } from "@/generated/prisma/client"

type RealtorOption = { id: string; user: { name: string } }

const UNASSIGNED = "__unassigned__"

export function LeadDetailsForm({
  leadId,
  notes,
  nextActionAt,
  realtorId,
  realtors,
  temperature,
  vip,
  tags,
  onSuccess,
}: {
  leadId: string
  notes: string | null
  nextActionAt: string | null
  realtorId: string | null
  realtors: RealtorOption[]
  temperature: LeadTemperature
  vip: boolean
  tags: string[]
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedRealtorId, setSelectedRealtorId] = useState(realtorId ?? UNASSIGNED)
  const [selectedTemperature, setSelectedTemperature] = useState<LeadTemperature>(temperature)
  const [isVip, setIsVip] = useState(vip)
  const [tagsValue, setTagsValue] = useState(tags.join(", "))

  function handleSubmit(formData: FormData) {
    const nextActionValue = String(formData.get("nextActionAt") ?? "")

    startTransition(async () => {
      try {
        await updateLead(leadId, {
          notes: String(formData.get("notes") ?? ""),
          nextActionAt: nextActionValue ? new Date(nextActionValue) : undefined,
          realtorId: selectedRealtorId === UNASSIGNED ? null : selectedRealtorId,
          temperature: selectedTemperature,
          vip: isVip,
          tags: tagsValue
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        })
        toast.success("Lead atualizado.")
        router.refresh()
        onSuccess?.()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao atualizar lead.")
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Temperatura</Label>
          <Select
            value={selectedTemperature}
            onValueChange={(value) => setSelectedTemperature(value as LeadTemperature)}
          >
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

        <div className="space-y-1.5">
          <Label>&nbsp;</Label>
          <label className="flex h-9 items-center gap-2 text-sm">
            <Checkbox checked={isVip} onCheckedChange={(checked) => setIsVip(checked === true)} />
            <Star className="size-3.5 text-gold" />
            Lead VIP
          </label>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
        <Input
          id="tags"
          value={tagsValue}
          onChange={(e) => setTagsValue(e.target.value)}
          placeholder="Ex: financiamento, urgente"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={notes ?? ""} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="nextActionAt">Próxima ação</Label>
          <Input
            id="nextActionAt"
            name="nextActionAt"
            type="date"
            defaultValue={nextActionAt ?? ""}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Corretor responsável</Label>
          <Select value={selectedRealtorId} onValueChange={setSelectedRealtorId}>
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
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  )
}
