import { prisma } from "@/lib/prisma"

export async function listUsers() {
  return prisma.user.findMany({
    where: { deletedAt: null },
    include: { role: true },
    orderBy: { name: "asc" },
  })
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } })
}

export async function createUser(data: {
  name: string
  email: string
  roleId: string
  passwordHash: string
}) {
  return prisma.user.create({ data, include: { role: true } })
}

export async function updateUser(
  id: string,
  data: { name: string; email: string; roleId: string; passwordHash?: string }
) {
  return prisma.user.update({ where: { id }, data, include: { role: true } })
}

export async function setUserActive(id: string, active: boolean) {
  return prisma.user.update({ where: { id }, data: { active } })
}

export async function listRoles() {
  return prisma.role.findMany({ orderBy: { name: "asc" } })
}
