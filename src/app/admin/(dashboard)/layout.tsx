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

  // Cópia (o Set original é cache por perfil): "goal.view" não existe no
  // banco — libera o menu Metas pra gestão (financial.view) e pra quem é
  // corretor (que lá só enxerga as próprias metas).
  const permissions = new Set(await getPermissions(session.user))
  if (permissions.has("financial.view") || session.user.realtorId) permissions.add("goal.view")

  return (
    <AdminShell user={session.user} permissions={permissions}>
      {children}
    </AdminShell>
  )
}
