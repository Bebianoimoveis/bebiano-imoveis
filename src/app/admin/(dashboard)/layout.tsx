import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { getPermissions } from "@/lib/permissions"
import { AdminShell } from "@/components/admin/admin-shell"

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
    <AdminShell user={session.user} permissions={permissions}>
      {children}
    </AdminShell>
  )
}
