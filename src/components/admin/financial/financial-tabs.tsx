"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"

import { Tabs } from "@/components/ui/tabs"

// Sincroniza a aba ativa com `?tab=` na URL — mesmo espírito do `view` em
// Propostas, mas aqui usando o Tabs (Radix) já existente no design system
// em modo controlado em vez de um toggle de link manual.
export function FinancialTabs({
  tab,
  className,
  children,
}: {
  tab: string
  className?: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <Tabs value={tab} onValueChange={handleChange} className={className}>
      {children}
    </Tabs>
  )
}
