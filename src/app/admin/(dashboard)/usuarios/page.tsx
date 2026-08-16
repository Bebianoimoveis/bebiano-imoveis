import { Plus, UserCog } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/shared/empty-state"
import { UserFormDialog } from "@/components/admin/users/user-form-dialog"
import { UserActiveToggle } from "@/components/admin/users/user-active-toggle"
import { listAdminUsers, listRoles } from "@/modules/user/actions"
import { roleLabel } from "@/modules/user/role-labels"

export default async function AdminUsersPage() {
  const [users, allRoles] = await Promise.all([listAdminUsers(), listRoles()])

  // Só Admin e Corretor ficam disponíveis para escolha — Gerente e
  // Financeiro continuam existindo no banco (usuários já cadastrados com
  // esses papéis não são afetados), só não aparecem mais como opção nova.
  const selectableRoles = allRoles
    .filter((role) => role.name === "ADMIN" || role.name === "REALTOR")
    .map((role) => ({ ...role, name: roleLabel(role.name) }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Usuários
          </h1>
          <p className="text-sm text-muted-foreground">
            Contas internas com acesso ao painel administrativo.
          </p>
        </div>
        <UserFormDialog
          mode="create"
          roles={selectableRoles}
          trigger={
            <Button>
              <Plus className="size-4" />
              Novo usuário
            </Button>
          }
        />
      </div>

      {users.length === 0 ? (
        <EmptyState icon={UserCog} title="Nenhum usuário cadastrado" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-40" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {roleLabel(user.role.name)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        user.active
                          ? "border-transparent bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
                          : "border-transparent bg-muted text-muted-foreground"
                      }
                    >
                      {user.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex items-center gap-1">
                    <UserFormDialog
                      mode="edit"
                      userId={user.id}
                      roles={
                        selectableRoles.some((role) => role.id === user.roleId)
                          ? selectableRoles
                          : [
                              ...selectableRoles,
                              { id: user.roleId, name: roleLabel(user.role.name) },
                            ]
                      }
                      defaultValues={{
                        name: user.name,
                        email: user.email,
                        roleId: user.roleId,
                      }}
                      trigger={
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      }
                    />
                    <UserActiveToggle userId={user.id} active={user.active} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
