import { prisma } from "@/lib/prisma"
import type { PermissionKey } from "@/lib/permissions"

export function createNotification(input: {
  userId: string
  title: string
  message: string
}) {
  return prisma.notification.create({ data: input })
}

export function listNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  })
}

export function countUnread(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } })
}

export function markRead(id: string, userId: string) {
  return prisma.notification.updateMany({ where: { id, userId }, data: { read: true } })
}

export function markAllRead(userId: string) {
  return prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } })
}

export async function findUserIdByRealtorId(realtorId: string): Promise<string | null> {
  const realtor = await prisma.realtor.findUnique({
    where: { id: realtorId },
    select: { userId: true },
  })
  return realtor?.userId ?? null
}

// Usado pra avisar todo mundo com determinada permissão (ex: admins/
// gestores quando um lead ou imóvel novo aparece) sem precisar manter uma
// lista fixa de "quem é admin" em cada gatilho de notificação.
export async function findUserIdsWithPermission(permission: PermissionKey): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: {
      active: true,
      deletedAt: null,
      role: { permissions: { some: { permission: { key: permission } } } },
    },
    select: { id: true },
  })
  return users.map((user) => user.id)
}
