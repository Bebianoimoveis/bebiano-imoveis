"use client"

import { useEffect, useState } from "react"

import { AdminSidebar, AdminMobileSidebar, type AdminSidebarUser } from "@/components/admin/admin-sidebar"
import { AdminTopbar, type AdminTopbarUser } from "@/components/admin/admin-topbar"
import { cn } from "@/lib/utils"

type AdminTheme = "dark" | "light"
const THEME_STORAGE_KEY = "admin-theme"

// Junta sidebar (desktop) + sidebar em Sheet (mobile) + topbar num único
// client component pra compartilhar o estado de "menu mobile aberto"
// entre o botão da topbar e o drawer da sidebar, e agora também o tema
// claro/escuro do admin (o site público nunca tem modo claro, só o admin).
export function AdminShell({
  user,
  permissions,
  children,
}: {
  user: AdminSidebarUser & AdminTopbarUser
  permissions: Set<string>
  children: React.ReactNode
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  // Sempre nasce "dark" (igual ao HTML renderizado no servidor) pra não
  // gerar mismatch de hidratação — se o usuário tiver escolhido claro,
  // o efeito abaixo troca logo no primeiro paint do cliente.
  const [theme, setTheme] = useState<AdminTheme>("dark")

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === "light") setTheme("light")
  }, [])

  // Dropdown/Tooltip/CommandDialog/Sheet portam pro document.body, fora da
  // árvore com a classe deste wrapper — sem isso, esses elementos
  // renderizam com os tokens do site público em vez do tema do admin.
  // Alternar a classe no body (só enquanto o admin está montado) resolve
  // pra todo mundo que porta pro body, sem precisar passar um `container`
  // manual em cada primitivo.
  useEffect(() => {
    document.body.classList.remove("dark", "admin-light")
    document.body.classList.add(theme === "dark" ? "dark" : "admin-light")
    return () => {
      document.body.classList.remove("dark", "admin-light")
    }
  }, [theme])

  function toggleTheme() {
    setTheme((prev) => {
      const next: AdminTheme = prev === "dark" ? "light" : "dark"
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
      return next
    })
  }

  return (
    <div
      className={cn(
        "flex min-h-screen bg-background text-foreground",
        theme === "dark" ? "dark" : "admin-light"
      )}
    >
      <AdminSidebar user={user} permissions={permissions} />
      <AdminMobileSidebar
        user={user}
        permissions={permissions}
        open={mobileSidebarOpen}
        onOpenChange={setMobileSidebarOpen}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          user={user}
          permissions={permissions}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <main className="flex-1 overflow-x-hidden p-6 md:p-8">{children}</main>
      </div>
    </div>
  )
}
