"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateLead } from "@/modules/lead/actions"

type RealtorOption = { id: string; user: { name: string } }

const UNASSIGNED = "__unassigned__"

export function LeadDetailsForm({
  leadId,
  notes,
  nextActionAt,
  realtorId,
  realtors,
}: {
  leadId: string
  notes: string | null
  nextActionAt: string | null
  realtorId: string | null
  realtors: RealtorOption[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedRealtorId, setSelectedRealtorId] = useState(realtorId ?? UNASSIGNED)

  function handleSubmit(formData: FormData) {
    const nextActionValue = String(formData.get("nextActionAt") ?? "")

    startTransition(async () => {
      try {
        await updateLead(leadId, {
          notes: String(formData.get("notes") ?? ""),
          nextActionAt: nextActionValue ? new Date(nextActionValue) : undefined,
          realtorId: selectedRealtorId === UNASSIGNED ? null : selectedRealtorId,
        })
        toast.success("Lead atualizado.")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao atualizar lead.")
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" name="notes" rows={4} defaultValue={notes ?? ""} />
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
