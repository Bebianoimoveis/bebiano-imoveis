"use client"

import { useActionState, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  submitContactRequest,
  type SubmitContactState,
} from "@/modules/lead/actions"

const initialState: SubmitContactState = { status: "idle" }

export function PropertyContactForm({
  propertyId,
  propertyTitle,
}: {
  propertyId: string
  propertyTitle: string
}) {
  const [startedAt] = useState(() => Date.now())
  const [state, formAction, isPending] = useActionState(
    async (_prev: SubmitContactState, formData: FormData) => {
      return submitContactRequest({
        name: formData.get("name"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        message: formData.get("message"),
        propertyId,
        source: "property_page",
        honeypot: formData.get("company"),
        startedAt,
      })
    },
    initialState
  )

  if (state.status === "success") {
    return (
      <p className="rounded-lg bg-primary/10 p-4 text-sm text-primary">
        {state.message}
      </p>
    )
  }

  return (
    <form action={formAction} className="space-y-3">
      <p className="text-sm font-medium">Tenho interesse neste imóvel</p>

      <div className="space-y-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" name="phone" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail (opcional)</Label>
        <Input id="email" name="email" type="email" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Mensagem</Label>
        <Textarea
          id="message"
          name="message"
          rows={3}
          defaultValue={`Olá! Tenho interesse no imóvel "${propertyTitle}".`}
        />
      </div>

      {/* honeypot — mantido fora da tela para humanos, mas visível para bots */}
      <div className="hidden" aria-hidden="true">
        <Label htmlFor="company">Empresa</Label>
        <Input id="company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      {state.status === "error" ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Enviando..." : "Enviar mensagem"}
      </Button>
    </form>
  )
}
