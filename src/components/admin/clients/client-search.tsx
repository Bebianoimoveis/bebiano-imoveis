"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useTransition } from "react"

import { Input } from "@/components/ui/input"

export function ClientSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set("search", value)
    } else {
      params.delete("search")
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <Input
      placeholder="Buscar por nome, telefone ou e-mail..."
      defaultValue={searchParams.get("search") ?? ""}
      className="max-w-xs"
      onChange={(event) => handleChange(event.target.value)}
    />
  )
}
