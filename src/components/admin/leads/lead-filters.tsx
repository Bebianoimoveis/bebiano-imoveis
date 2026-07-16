"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useTransition } from "react"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LEAD_STAGE_LABELS, LEAD_STAGE_ORDER } from "@/components/admin/leads/lead-stage"

const ALL = "__all__"

export function LeadFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === ALL || value === "") {
      params.delete(key)
    } else {
      params.set(key, value)
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Buscar por nome..."
        defaultValue={searchParams.get("search") ?? ""}
        className="w-full max-w-xs"
        onChange={(event) => updateParam("search", event.target.value)}
      />

      <Select
        defaultValue={searchParams.get("stage") ?? ALL}
        onValueChange={(value) => updateParam("stage", value)}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Etapa do funil" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todas as etapas</SelectItem>
          {LEAD_STAGE_ORDER.map((stage) => (
            <SelectItem key={stage} value={stage}>
              {LEAD_STAGE_LABELS[stage]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
