import Link from "next/link"
import {
  LayoutDashboard,
  Building2,
  Users2,
  Contact,
  CalendarDays,
  FileText,
  FileSignature,
  Wallet,
  BarChart3,
  UserCog,
  Settings,
  LogOut,
} from "lucide-react"

import { signOutAction } from "@/modules/auth/actions"
import { Button } from "@/components/ui/button"
import type { PermissionKey } from "@/lib/permissions"

type AdminSidebarProps = {
  user: {
    name?: string | null
    roleName: string
  }
  permissions: Set<string>
}

const navItems: {
  label: string
  href: string
  icon: typeof LayoutDashboard
  permission?: PermissionKey
}[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Imóveis", href: "/admin/imoveis", icon: Building2, permission: "property.create" },
  { label: "Leads", href: "/admin/leads", icon: Users2, permission: "lead.manage" },
  { label: "Clientes", href: "/admin/clientes", icon: Contact, permission: "client.manage" },
  { label: "Agenda", href: "/admin/agenda", icon: CalendarDays, permission: "appointment.manage" },
  { label: "Propostas", href: "/admin/propostas", icon: FileText, permission: "proposal.manage" },
  { label: "Contratos", href: "/admin/contratos", icon: FileSignature, permission: "contract.manage" },
  { label: "Financeiro", href: "/admin/financeiro", icon: Wallet, permission: "financial.view" },
  { label: "Relatórios", href: "/admin/relatorios", icon: BarChart3, permission: "report.view" },
  { label: "Usuários", href: "/admin/usuarios", icon: UserCog, permission: "user.manage" },
  { label: "Configurações", href: "/admin/configuracoes", icon: Settings, permission: "settings.manage" },
]

export function AdminSidebar({ user, permissions }: AdminSidebarProps) {
  const visibleItems = navItems.filter(
    (item) => !item.permission || permissions.has(item.permission)
  )

  return (
    <aside className="flex w-64 flex-col border-r border-border/60 bg-sidebar text-sidebar-foreground">
      <div className="px-6 py-6">
        <p className="font-heading text-lg font-semibold tracking-tight text-sidebar-accent">
          Bebiano Imóveis
        </p>
        <p className="mt-1 text-xs text-sidebar-foreground/60">
          {user.name} · {user.roleName}
        </p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-primary/10 hover:text-sidebar-foreground"
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <form action={signOutAction} className="px-3 pb-6">
        <Button
          type="submit"
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-sidebar-foreground"
        >
          <LogOut className="size-4" />
          Sair
        </Button>
      </form>
    </aside>
  )
}
