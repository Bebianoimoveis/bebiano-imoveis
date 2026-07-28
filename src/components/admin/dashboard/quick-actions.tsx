import Link from "next/link"
import { Building2, CalendarDays, Contact, FileText, type LucideIcon } from "lucide-react"

import type { PermissionKey } from "@/lib/permissions"

// Só rotas reais — nada de atalho pra uma tela de criação que não existe
// (ex.: não há cadastro manual de lead no admin hoje, leads só nascem dos
// formulários públicos).
const ACTIONS: { label: string; href: string; icon: LucideIcon; permission: PermissionKey }[] = [
  { label: "Novo imóvel", href: "/admin/imoveis/novo", icon: Building2, permission: "property.create" },
  { label: "Agendar visita", href: "/admin/agenda", icon: CalendarDays, permission: "appointment.manage" },
  { label: "Nova proposta", href: "/admin/propostas", icon: FileText, permission: "proposal.manage" },
  { label: "Cadastrar cliente", href: "/admin/clientes", icon: Contact, permission: "client.manage" },
]

export function QuickActions({ permissions }: { permissions: Set<string> }) {
  const visible = ACTIONS.filter((action) => permissions.has(action.permission))
  if (visible.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {visible.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="group flex flex-col items-center gap-2 rounded-[20px] border border-border/60 bg-card p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-black/20"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <action.icon className="size-5" />
          </span>
          <span className="text-xs font-medium text-foreground">{action.label}</span>
        </Link>
      ))}
    </div>
  )
}
