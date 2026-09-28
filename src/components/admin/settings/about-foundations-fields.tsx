"use client"

import { useFormContext } from "react-hook-form"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { SiteSettingsInput } from "@/modules/settings/schema"

export function AboutFoundationsFields() {
  const { register } = useFormContext<SiteSettingsInput>()

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-lg border border-border/60 p-3">
        <p className="text-xs font-medium text-muted-foreground">Versículo-base</p>
        <Label className="text-xs text-muted-foreground">Referência (ex: Mateus 5:14-16)</Label>
        <Input {...register("aboutFoundations.verseRef")} />
        <Label className="text-xs text-muted-foreground">Texto do versículo</Label>
        <Textarea rows={3} {...register("aboutFoundations.verseText")} />
      </div>

      <div className="space-y-2 rounded-lg border border-border/60 p-3">
        <p className="text-xs font-medium text-muted-foreground">Regra de vida</p>
        <Label className="text-xs text-muted-foreground">Texto</Label>
        <Textarea rows={2} {...register("aboutFoundations.ruleText")} />
        <Label className="text-xs text-muted-foreground">Referência (ex: Mateus 7:12)</Label>
        <Input {...register("aboutFoundations.ruleRef")} />
      </div>

      <div className="space-y-2 rounded-lg border border-border/60 p-3">
        <p className="text-xs font-medium text-muted-foreground">A placa invisível</p>
        <Label className="text-xs text-muted-foreground">Texto</Label>
        <Textarea rows={2} {...register("aboutFoundations.badgeText")} />
        <Label className="text-xs text-muted-foreground">Autor da frase</Label>
        <Input {...register("aboutFoundations.badgeAuthor")} />
      </div>

      <div className="space-y-2 rounded-lg border border-border/60 p-3">
        <p className="text-xs font-medium text-muted-foreground">Lista de prioridades (1º, 2º e 3º lugar)</p>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{index + 1}º lugar</Label>
              <Input {...register(`aboutFoundations.priorities.${index}` as const)} />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-border/60 p-3">
        <p className="text-xs font-medium text-muted-foreground">Os 3 cards de &ldquo;Propósito&rdquo;</p>
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-1.5 rounded-lg border border-border/40 p-2.5">
              <Label className="text-xs text-muted-foreground">Card {index + 1} — Título</Label>
              <Input {...register(`aboutFoundations.purpose.${index}.title` as const)} />
              <Label className="text-xs text-muted-foreground">Card {index + 1} — Texto</Label>
              <Textarea rows={2} {...register(`aboutFoundations.purpose.${index}.text` as const)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
