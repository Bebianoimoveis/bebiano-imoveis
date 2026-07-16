import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { getPermissions } from "@/lib/permissions"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Segunda camada de proteção além do middleware — Server Components
  // nunca devem confiar apenas na checagem feita antes da rota.
  if (!session?.user) {
    redirect("/admin/login")
  }

  const permissions = await getPermissions(session.user)

  return (
    <div className="flex min-h-screen">
      <AdminSidebar user={session.user} permissions={permissions} />
      <main className="flex-1 bg-secondary/20 p-6 md:p-8">{children}</main>
    </div>
  )
}
