"use client"

import { useActionState, useState } from "react"
import { CalendarCheck } from "lucide-react"

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  submitVisitRequest,
  type SubmitVisitState,
} from "@/modules/appointment/actions"

const TIME_SLOTS = [
  "09:00", "10:00", "11:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
]

const initialState: SubmitVisitState = { status: "idle" }

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function PropertyVisitDialog({
  propertyId,
  propertyTitle,
}: {
  propertyId: string
  propertyTitle: string
}) {
  const [open, setOpen] = useState(false)
  const [startedAt] = useState(() => Date.now())
  const [state, formAction, isPending] = useActionState(
    async (_prev: SubmitVisitState, formData: FormData) => {
      return submitVisitRequest({
        name: formData.get("name"),
        phone: formData.get("phone"),
        preferredDate: formData.get("preferredDate"),
        preferredTime: formData.get("preferredTime"),
        message: formData.get("message"),
        propertyId,
        honeypot: formData.get("company"),
        startedAt,
      })
    },
    initialState
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <CalendarCheck className="size-4" />
        Agendar visita
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agendar visita</DialogTitle>
          <DialogDescription>
            {propertyTitle} — escolha o melhor dia e horário para você.
          </DialogDescription>
        </DialogHeader>

        {state.status === "success" ? (
          <p className="rounded-lg border border-primary/30 bg-primary/15 p-4 text-sm text-foreground">
            {state.message}
          </p>
        ) : (
          <form action={formAction} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="visit-name">Nome</Label>
              <Input id="visit-name" name="name" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="visit-phone">Telefone</Label>
              <Input id="visit-phone" name="phone" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="visit-date">Data</Label>
                <Input
                  id="visit-date"
                  name="preferredDate"
                  type="date"
                  min={todayISO()}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="visit-time">Horário</Label>
                <Select name="preferredTime" required>
                  <SelectTrigger id="visit-time" className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* honeypot — mantido fora da tela para humanos, mas visível para bots */}
            <div className="hidden" aria-hidden="true">
              <Label htmlFor="visit-company">Empresa</Label>
              <Input id="visit-company" name="company" tabIndex={-1} autoComplete="off" />
            </div>

            {state.status === "error" ? (
              <p className="text-sm text-destructive">{state.message}</p>
            ) : null}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Enviando..." : "Solicitar agendamento"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
