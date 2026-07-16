import { prisma } from "@/lib/prisma"

// Chaves de permissão no formato "recurso.ação".
// Novas permissões devem ser adicionadas aqui e replicadas no seed.
export type PermissionKey =
  | "property.create"
  | "property.edit"
  | "property.publish"
  | "property.delete"
  | "property.view.all"
  | "taxonomy.manage"
  | "lead.view.all"
  | "lead.view.own"
  | "lead.manage"
  | "client.manage"
  | "realtor.manage"
  | "appointment.manage"
  | "appointment.view.all"
  | "proposal.manage"
  | "proposal.view.all"
  | "contract.manage"
  | "contract.view.all"
  | "financial.view"
  | "financial.manage"
  | "report.view"
  | "user.manage"
  | "settings.manage"

type SessionUser = {
  roleId: string
}

const permissionsByRoleCache = new Map<string, Set<string>>()

async function getPermissionsForRole(roleId: string): Promise<Set<string>> {
  const cached = permissionsByRoleCache.get(roleId)
  if (cached) return cached

  const rolePermissions = await prisma.rolePermission.findMany({
    where: { roleId },
    include: { permission: true },
  })

  const keys = new Set(rolePermissions.map((rp) => rp.permission.key))
  permissionsByRoleCache.set(roleId, keys)
  return keys
}

// Única fonte de verdade para autorização — deve ser chamada em toda
// Server Action e Server Component que acessa dados sensíveis. Nunca
// confiar apenas em esconder botões no client.
export async function can(
  user: SessionUser | undefined | null,
  permission: PermissionKey
): Promise<boolean> {
  if (!user) return false
  const permissions = await getPermissionsForRole(user.roleId)
  return permissions.has(permission)
}

// Usado quando é preciso checar várias permissões de uma vez (ex: filtrar
// itens de navegação) sem repetir uma consulta ao banco por permissão —
// a consulta em si já é cacheada por roleId, mas isso evita N chamadas a can().
export async function getPermissions(
  user: SessionUser | undefined | null
): Promise<Set<string>> {
  if (!user) return new Set()
  return getPermissionsForRole(user.roleId)
}

export function invalidatePermissionsCache(roleId?: string) {
  if (roleId) {
    permissionsByRoleCache.delete(roleId)
    return
  }
  permissionsByRoleCache.clear()
}
