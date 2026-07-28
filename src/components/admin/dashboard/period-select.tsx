"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { CalendarRange } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const OPTIONS = [
  { days: 7, label: "Últimos 7 dias" },
  { days: 30, label: "Últimos 30 dias" },
  { days: 90, label: "Últimos 90 dias" },
]

export function PeriodSelect({ periodDays }: { periodDays: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const current = OPTIONS.find((option) => option.days === periodDays) ?? OPTIONS[1]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-border hover:bg-secondary/60"
        >
          <CalendarRange className="size-4 text-muted-foreground" />
          {current.label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.days}
            onSelect={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.set("periodo", String(option.days))
              router.push(`${pathname}?${params.toString()}`)
            }}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
