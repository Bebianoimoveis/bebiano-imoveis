import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { getPermissions } from "@/lib/permissions"
import { AdminShell } from "@/components/admin/admin-shell"

// Algumas ações do admin (ex: criar corretor) encadeiam várias idas ao
// banco + bcrypt — o padrão de 10s do Vercel já foi visto estourando
// nelas em produção. 30s dá folga sem exagerar.
export const maxDuration = 30

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
