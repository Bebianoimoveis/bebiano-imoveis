import { prisma } from "@/lib/prisma"

// O hash da senha nunca sai daqui: estes registros vão pra telas e pra
// respostas de Server Action. Quem precisa dele (login) lê direto em
// lib/auth.ts.
const withoutPassword = { passwordHash: true } as const

export async function listUsers() {
  return prisma.user.findMany({
    where: { deletedAt: null },
    include: { role: true },
    omit: withoutPassword,
    orderBy: { name: "asc" },
  })
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email }, omit: withoutPassword })
}

export async function createUser(data: {
  name: string
  email: string
  roleId: string
  passwordHash: string
}) {
  return prisma.user.create({ data, include: { role: true }, omit: withoutPassword })
}

export async function updateUser(
  id: string,
  data: { name: string; email: string; roleId: string; passwordHash?: string }
) {
  return prisma.user.update({ where: { id }, data, include: { role: true }, omit: withoutPassword })
}

export async function setUserActive(id: string, active: boolean) {
  return prisma.user.update({ where: { id }, data: { active }, omit: withoutPassword })
}

export async function listRoles() {
  return prisma.role.findMany({ orderBy: { name: "asc" } })
}
