"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { addLeadInteraction } from "@/modules/lead/actions"

const TYPE_LABELS: Record<string, string> = {
  CALL: "Ligação",
  WHATSAPP: "WhatsApp",
  EMAIL: "E-mail",
  VISIT: "Visita",
  NOTE: "Anotação",
}

export function LeadInteractionForm({ leadId }: { leadId: string }) {
  const router = useRouter()
  const [type, setType] = useState("NOTE")
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    const description = String(formData.get("description") ?? "").trim()
    if (!description) return

    startTransition(async () => {
      try {
        await addLeadInteraction(leadId, { type, description })
        formRef.current?.reset()
        toast.success("Interação registrada.")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao registrar.")
      }
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3">
      <Select value={type} onValueChange={setType}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Textarea name="description" placeholder="Descreva o contato..." rows={3} required />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Registrar interação"}
      </Button>
    </form>
  )
}
