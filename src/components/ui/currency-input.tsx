"use client"

import * as React from "react"

import { Input } from "@/components/ui/input"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

// Preenche da direita pra esquerda, como caixa eletrônico: os dois últimos
// dígitos digitados são sempre os centavos. Isso elimina a ambiguidade de
// um <input type="number"> puro, onde "20000" podia ser lido como R$
// 20.000,00 quando a intenção era R$ 200,00.
export function CurrencyInput({
  value,
  onChange,
  ...props
}: {
  // react-hook-form entrega `field.value` como `unknown` neste form (por
  // causa do generic de transform do zod) — aceitar aqui evita um cast
  // inseguro em cada call site; Number() já lida bem com qualquer coisa
  // coercível.
  value: unknown
  onChange: (value: number) => void
} & Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type" | "inputMode">) {
  const cents = Math.round(Number(value ?? 0) * 100)
  const display = cents ? currencyFormatter.format(cents / 100) : ""

  return (
    <Input
      type="text"
      inputMode="numeric"
      placeholder="R$ 0,00"
      value={display}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "")
        onChange(Number(digits || "0") / 100)
      }}
      {...props}
    />
  )
}
