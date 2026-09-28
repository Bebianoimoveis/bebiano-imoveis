"use client"

import { useFormContext } from "react-hook-form"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { SiteSettingsInput } from "@/modules/settings/schema"

type ListFieldName = "aboutDifferentiators" | "aboutHowWeWork" | "aboutValues" | "aboutWhyChoose"

// Reaproveitado pelas 4 seções da Sobre que são listas de cards
// "título + texto" com ícone fixo (Diferencial, Como Trabalhamos,
// Valores, Por que Escolher) — só muda o nome do campo e o rótulo de
// cada item.
export function AboutItemListFields({
  name,
  itemLabels,
}: {
  name: ListFieldName
  itemLabels: string[]
}) {
  const { register } = useFormContext<SiteSettingsInput>()

  return (
    <div className="space-y-3">
      {itemLabels.map((label, index) => (
        <div key={index} className="space-y-2 rounded-lg border border-border/60 p-3">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <Input placeholder="Título" {...register(`${name}.${index}.title` as const)} />
          <Textarea rows={2} placeholder="Texto" {...register(`${name}.${index}.text` as const)} />
        </div>
      ))}
    </div>
  )
}
