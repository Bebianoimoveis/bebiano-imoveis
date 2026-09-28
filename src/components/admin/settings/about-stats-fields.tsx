"use client"

import { useFormContext } from "react-hook-form"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SiteSettingsInput } from "@/modules/settings/schema"

export function AboutStatsFields() {
  const { register } = useFormContext<SiteSettingsInput>()

  return (
    <div className="space-y-3">
      {[0, 1, 2].map((index) => (
        <div key={index} className="grid grid-cols-[80px_80px_1fr] gap-2 rounded-lg border border-border/60 p-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Número</Label>
            <Input type="number" {...register(`aboutStats.${index}.value` as const, { valueAsNumber: true })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Sufixo</Label>
            <Input placeholder="Ex: +, %" {...register(`aboutStats.${index}.suffix` as const)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Legenda</Label>
            <Input placeholder="Ex: clientes atendidos" {...register(`aboutStats.${index}.label` as const)} />
          </div>
        </div>
      ))}
    </div>
  )
}
