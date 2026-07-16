import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

type Scope = { realtorId?: string }

function scopeWhere(scope: Scope) {
  return scope.realtorId ? { realtorId: scope.realtorId } : {}
}

export async function countPropertiesByStatus(scope: Scope) {
  const where = scopeWhere(scope)
  const [published, sold, rented, unavailable] = await Promise.all([
    prisma.property.count({ where: { ...where, status: "PUBLISHED", deletedAt: null } }),
    prisma.property.count({ where: { ...where, status: "SOLD", deletedAt: null } }),
    prisma.property.count({ where: { ...where, status: "RENTED", deletedAt: null } }),
    prisma.property.count({ where: { ...where, status: "UNAVAILABLE", deletedAt: null } }),
  ])
  return { published, sold, rented, unavailable }
}

export async function countNewLeads(scope: Scope, sinceDays: number) {
  const since = new Date()
  since.setDate(since.getDate() - sinceDays)

  return prisma.lead.count({
    where: { ...scopeWhere(scope), createdAt: { gte: since }, deletedAt: null },
  })
}

export async function countUpcomingAppointments(scope: Scope) {
  return prisma.appointment.count({
    where: {
      ...scopeWhere(scope),
      scheduledAt: { gte: new Date() },
      status: { in: ["SCHEDULED", "CONFIRMED"] },
    },
  })
}

export async function countOpenProposals(scope: Scope) {
  return prisma.proposal.count({
    where: { ...scopeWhere(scope), status: "OPEN" },
  })
}

export async function sumSalesInPeriod(scope: Scope, from: Date, to: Date) {
  const result = await prisma.contract.aggregate({
    where: {
      ...scopeWhere(scope),
      status: { in: ["ACTIVE", "COMPLETED"] },
      createdAt: { gte: from, lte: to },
    },
    _sum: { value: true },
    _count: true,
  })
  return { total: result._sum.value ?? 0, count: result._count }
}

export async function leadsByOrigin(scope: Scope) {
  const groups = await prisma.lead.groupBy({
    by: ["origin"],
    where: { ...scopeWhere(scope), deletedAt: null },
    _count: true,
    orderBy: { _count: { origin: "desc" } },
  })
  return groups.map((g) => ({ origin: g.origin, count: g._count }))
}

export async function topViewedProperties(scope: Scope, take: number) {
  return prisma.property.findMany({
    where: { ...scopeWhere(scope), deletedAt: null, status: "PUBLISHED" },
    select: { id: true, code: true, title: true, viewCount: true },
    orderBy: { viewCount: "desc" },
    take,
  })
}

export async function recentActivity(take: number, where?: Prisma.ActivityLogWhereInput) {
  return prisma.activityLog.findMany({
    where,
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take,
  })
}

export async function salesByMonth(scope: Scope, months: number) {
  const since = new Date()
  since.setMonth(since.getMonth() - months + 1)
  since.setDate(1)
  since.setHours(0, 0, 0, 0)

  const contracts = await prisma.contract.findMany({
    where: {
      ...scopeWhere(scope),
      status: { in: ["ACTIVE", "COMPLETED"] },
      createdAt: { gte: since },
    },
    select: { value: true, createdAt: true },
  })

  const buckets = new Map<string, { total: number; count: number }>()
  for (const contract of contracts) {
    const key = `${contract.createdAt.getFullYear()}-${String(contract.createdAt.getMonth() + 1).padStart(2, "0")}`
    const bucket = buckets.get(key) ?? { total: 0, count: 0 }
    bucket.total += Number(contract.value)
    bucket.count += 1
    buckets.set(key, bucket)
  }

  return buckets
}
