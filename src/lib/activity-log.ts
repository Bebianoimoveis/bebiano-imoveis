import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

export async function logActivity(input: {
  userId: string
  action: string
  entityType: string
  entityId: string
  metadata?: Record<string, unknown>
}) {
  await prisma.activityLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  })
}
