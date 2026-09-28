"use client"

import { useFormContext } from "react-hook-form"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { SiteSettingsInput } from "@/modules/settings/schema"

const FIELDS = [
  { key: "missao", label: "Missão" },
  { key: "visao", label: "Visão" },
  { key: "valores", label: "Valores" },
  { key: "proposito", label: "Propósito" },
] as const

export function AboutMissionValuesFields() {
  const { register } = useFormContext<SiteSettingsInput>()

  return (
    <div className="space-y-3">
      {FIELDS.map((field) => (
        <div key={field.key} className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{field.label}</Label>
          <Textarea rows={3} {...register(`aboutMissionValues.${field.key}` as const)} />
        </div>
      ))}
    </div>
  )
}
