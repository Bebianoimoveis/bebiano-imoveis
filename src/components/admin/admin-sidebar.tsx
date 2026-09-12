"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
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
  Link2,
  LogOut,
  MessageSquareQuote,
  LayoutGrid,
  ClipboardList,
  IdCard,
  MapPin,
} from "lucide-react"

import { signOutAction } from "@/modules/auth/actions"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet } from "@/components/ui/sheet"
import type { PermissionKey } from "@/lib/permissions"
import { cn } from "@/lib/utils"

export type AdminSidebarUser = {
  name?: string | null
  roleName: string
}

type NavItem = {
  label: string
  href: string
  icon: typeof LayoutDashboard
  permission?: PermissionKey
}

type NavGroup = {
  label: string
  items: NavItem[]
}

// Nomenclatura de "centro de operações" em vez de termos genéricos de
// CRM — só o texto visível muda; módulos/rotas internos continuam com
// os nomes técnicos de sempre.
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Geral",
    items: [
      { label: "Visão Geral", href: "/admin", icon: LayoutDashboard },
      { label: "Portfólio de Imóveis", href: "/admin/imoveis", icon: Building2, permission: "property.create" },
      { label: "Segmentos", href: "/admin/segmentos", icon: LayoutGrid, permission: "segment.manage" },
      { label: "Captação", href: "/admin/captacao", icon: ClipboardList, permission: "submission.manage" },
      { label: "Central de Leads", href: "/admin/leads", icon: Users2, permission: "lead.manage" },
      { label: "Clientes", href: "/admin/clientes", icon: Contact, permission: "client.manage" },
      { label: "Corretores", href: "/admin/corretores", icon: IdCard, permission: "realtor.manage" },
      { label: "Links dos Corretores", href: "/admin/corretores/links", icon: Link2, permission: "realtor.manage" },
    ],
  },
  {
    label: "Negócios",
    items: [
      { label: "Agenda", href: "/admin/agenda", icon: CalendarDays, permission: "appointment.manage" },
      { label: "Propostas", href: "/admin/propostas", icon: FileText, permission: "proposal.manage" },
      { label: "Contratos", href: "/admin/contratos", icon: FileSignature, permission: "contract.manage" },
      { label: "Gestão Financeira", href: "/admin/financeiro", icon: Wallet, permission: "financial.view" },
    ],
  },
  {
    label: "Gestão",
    items: [
      { label: "Depoimentos", href: "/admin/depoimentos", icon: MessageSquareQuote, permission: "testimonial.manage" },
      { label: "Usuários", href: "/admin/usuarios", icon: UserCog, permission: "user.manage" },
      { label: "Inteligência de Negócios", href: "/admin/relatorios", icon: BarChart3, permission: "report.view" },
      { label: "Taxonomias", href: "/admin/taxonomias", icon: MapPin, permission: "taxonomy.manage" },
      { label: "Configurações", href: "/admin/configuracoes", icon: Settings, permission: "settings.manage" },
    ],
  },
]

function initials(name?: string | null) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase()
}

function matchesRoute(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin"
  return pathname === href || pathname.startsWith(`${href}/`)
}

// "/admin/corretores" é prefixo de "/admin/corretores/links" — sem isso,
// os dois itens acendiam juntos quando a rota mais específica estava
// ativa. Só o href mais específico (mais longo) entre os que batem vira
// o ativo.
function findActiveHref(pathname: string, hrefs: string[]) {
  return hrefs
    .filter((href) => matchesRoute(pathname, href))
    .sort((a, b) => b.length - a.length)[0]
}

function SidebarContent({
  user,
  permissions,
  pathname,
  onNavigate,
}: {
  user: AdminSidebarUser
  permissions: Set<string>
  pathname: string
  onNavigate?: () => void
}) {
  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.permission || permissions.has(item.permission)),
  })).filter((group) => group.items.length > 0)

  const activeHref = findActiveHref(
    pathname,
    groups.flatMap((group) => group.items.map((item) => item.href))
  )

  return (
    <div className="flex h-full flex-col">
      {/* halo pedido atrás da logo só existe em modo claro (::before de
          .admin-sidebar-halo, ver globals.css) — precisa de position:
          relative aqui pro ::before absoluto se ancorar. Espaçamento
          maior (py-8) pra logo "respirar" mais dentro do halo. */}
      <div className="admin-sidebar-halo relative overflow-hidden px-6 py-8">
        <Image
          src="/images/logo.png"
          alt="Bebiano Imóveis"
          width={97}
          height={80}
          priority
          className="relative h-16 w-auto"
        />
      </div>

      <div className="mx-4 mb-5 flex items-center gap-3 rounded-2xl bg-secondary/60 p-3 admin-light:bg-white/[0.07]">
        <Avatar size="default">
          <AvatarFallback className="bg-primary/20 text-primary admin-light:bg-white/15 admin-light:text-white">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground admin-light:text-white">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground admin-light:text-white/65">{user.roleName}</p>
        </div>
      </div>

      <nav className="admin-sidebar-scrollbar flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase admin-light:text-white/60">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = item.href === activeHref
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/15 text-foreground admin-light:border admin-light:border-white/10 admin-light:bg-[linear-gradient(90deg,#8F1238,#700B29)] admin-light:text-white admin-light:shadow-[0_4px_16px_rgba(122,12,46,0.30)]"
                        : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground admin-light:text-white/75 admin-light:hover:bg-white/[0.08] admin-light:hover:text-white"
                    )}
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="admin-nav-active"
                        transition={{ type: "spring", damping: 28, stiffness: 320 }}
                        className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-full bg-primary admin-light:bg-white/80"
                      />
                    ) : null}
                    <item.icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        isActive
                          ? "text-primary admin-light:text-white"
                          : "text-muted-foreground group-hover:text-foreground admin-light:text-white/75 admin-light:group-hover:text-white"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <form action={signOutAction} className="px-3 pb-6">
        <Button
          type="submit"
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground admin-light:text-white/70 admin-light:hover:bg-white/[0.08] admin-light:hover:text-white"
        >
          <LogOut className="size-4" />
          Sair
        </Button>
      </form>
    </div>
  )
}

export function AdminSidebar({
  user,
  permissions,
}: {
  user: AdminSidebarUser
  permissions: Set<string>
}) {
  const pathname = usePathname()

  return (
    <aside className="admin-sidebar-surface sticky top-0 hidden h-screen w-72 shrink-0 self-start overflow-hidden border-r border-border/60 bg-sidebar text-sidebar-foreground admin-light:border-transparent md:block">
      <SidebarContent user={user} permissions={permissions} pathname={pathname} />
    </aside>
  )
}

// Versão mobile — acionada por um botão na topbar, vive num Sheet
// separado em vez de esconder a sidebar inteira sem alternativa.
export function AdminMobileSidebar({
  user,
  permissions,
  open,
  onOpenChange,
}: {
  user: AdminSidebarUser
  permissions: Set<string>
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const pathname = usePathname()

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      side="left"
      className="admin-sidebar-surface bg-sidebar text-sidebar-foreground"
    >
      <SidebarContent
        user={user}
        permissions={permissions}
        pathname={pathname}
        onNavigate={() => onOpenChange(false)}
      />
    </Sheet>
  )
}
