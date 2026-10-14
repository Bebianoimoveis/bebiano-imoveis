"use client"

import { useFormContext } from "react-hook-form"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { SiteSettingsInput } from "@/modules/settings/schema"

const SIDES = ["à esquerda da foto", "à direita da foto"]
const PARAGRAPH_LABELS = ["1º parágrafo", "2º parágrafo", "3º parágrafo"]

export function AboutFoundersFields() {
  const { register } = useFormContext<SiteSettingsInput>()

  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-secondary/40 p-3 text-xs text-muted-foreground">
        <strong>Números que atualizam sozinhos:</strong> um número entre colchetes duplos, como{" "}
        <code>[[42]]</code>, soma +1 a cada ano novo (em 2027 o site mostra 43). É o que mantém a idade e os
        &ldquo;há X anos&rdquo; certos. Se um número não deve mudar, escreva sem os colchetes.
      </p>

      {[0, 1].map((person) => (
        <div key={person} className="space-y-2 rounded-lg border border-border/60 p-3">
          <p className="text-xs font-medium text-muted-foreground">Pessoa {person + 1} — texto {SIDES[person]}</p>
          <Label className="text-xs text-muted-foreground">Nome (aparece em dourado e embaixo da foto)</Label>
          <Input {...register(`aboutFounders.founders.${person}.name` as const)} />
          {PARAGRAPH_LABELS.map((label, index) => (
            <div key={label} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <Textarea rows={4} {...register(`aboutFounders.founders.${person}.paragraphs.${index}` as const)} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
