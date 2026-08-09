"use client"

import { useEffect, useState } from "react"

import { AdminSidebar, AdminMobileSidebar, type AdminSidebarUser } from "@/components/admin/admin-sidebar"
import { AdminTopbar, type AdminTopbarUser } from "@/components/admin/admin-topbar"

// Junta sidebar (desktop) + sidebar em Sheet (mobile) + topbar num único
// client component pra compartilhar o estado de "menu mobile aberto"
// entre o botão da topbar e o drawer da sidebar.
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

  // Dropdown/Tooltip/CommandDialog/Sheet portam pro document.body, fora da
  // árvore com a classe `dark` deste wrapper — sem isso, esses elementos
  // renderizam com os tokens claros do site público em vez do tema escuro
  // do admin. Alternar a classe no body (só enquanto o admin está montado)
  // resolve pra todo mundo que porta pro body, sem precisar passar um
  // `container` manual em cada primitivo.
  useEffect(() => {
    document.body.classList.add("dark")
    return () => {
      document.body.classList.remove("dark")
    }
  }, [])

  return (
    <div className="dark flex min-h-screen bg-background text-foreground">
      <AdminSidebar user={user} permissions={permissions} />
      <AdminMobileSidebar
        user={user}
        permissions={permissions}
        open={mobileSidebarOpen}
        onOpenChange={setMobileSidebarOpen}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar user={user} permissions={permissions} onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden p-6 md:p-8">{children}</main>
      </div>
    </div>
  )
}
