"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Contact, FileText, Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { PermissionKey } from "@/lib/permissions"

const SHORTCUTS: { label: string; href: string; icon: typeof Contact; permission: PermissionKey }[] = [
  { label: "Novo cliente", href: "/admin/clientes", icon: Contact, permission: "client.manage" },
  { label: "Nova proposta", href: "/admin/propostas", icon: FileText, permission: "proposal.manage" },
  { label: "Financeiro", href: "/admin/financeiro", icon: Wallet, permission: "financial.view" },
]

function greetingForHour(hour: number) {
  if (hour < 12) return "Bom dia"
  if (hour < 18) return "Boa tarde"
  return "Boa noite"
}

export function DashboardGreetingBar({
  firstName,
  permissionKeys,
  extra,
}: {
  firstName: string
  permissionKeys: string[]
  extra?: React.ReactNode
}) {
  // null até o primeiro efeito rodar no client — evita hidratação
  // divergente (servidor não sabe a hora local real do navegador).
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const interval = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(interval)
  }, [])

  const permissions = new Set(permissionKeys)
  const visibleShortcuts = SHORTCUTS.filter((shortcut) => permissions.has(shortcut.permission))

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {now ? greetingForHour(now.getHours()) : "Olá"}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {now
            ? `${now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })} · ${now.toLocaleTimeString(
                "pt-BR",
                { hour: "2-digit", minute: "2-digit" }
              )}`
            : "Aqui está o resumo geral da Bebiano Imóveis."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {visibleShortcuts.map((shortcut) => (
          <Button key={shortcut.href} asChild variant="outline" size="sm" className="gap-1.5">
            <Link href={shortcut.href}>
              <shortcut.icon className="size-3.5" />
              {shortcut.label}
            </Link>
          </Button>
        ))}
        {extra}
      </div>
    </div>
  )
}
