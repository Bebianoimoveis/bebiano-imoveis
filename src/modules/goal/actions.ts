"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { logActivity } from "@/lib/activity-log"
import { goalInputSchema } from "@/modules/goal/schema"
import * as goalRepository from "@/modules/goal/repository"

async function requireFinancialManage() {
  const session = await auth()
  if (!session?.user) throw new Error("Não autenticado.")
  if (!(await can(session.user, "financial.manage"))) {
    throw new Error("Sem permissão para gerenciar metas.")
  }
  return session
}

async function requireFinancialView() {
  const session = await auth()
  if (!session?.user) throw new Error("Não autenticado.")
  if (!(await can(session.user, "financial.view"))) {
    throw new Error("Sem permissão para acessar metas.")
  }
  return session
}

export async function listAdminGoals(year: number) {
  await requireFinancialView()
  const goals = await goalRepository.listGoals(year)

  const withProgress = await Promise.all(
    goals.map(async (goal) => ({
      id: goal.id,
      scope: goal.scope,
      year: goal.year,
      month: goal.month,
      targetAmount: Number(goal.targetAmount),
      realtorId: goal.realtorId,
      realtorName: goal.realtor?.user.name ?? null,
      cityId: goal.cityId,
      cityName: goal.city ? `${goal.city.name} - ${goal.city.state}` : null,
      realized: await goalRepository.getRealizedForGoal(goal),
    }))
  )

  return withProgress
}

export async function saveGoal(input: unknown) {
  const session = await requireFinancialManage()
  const data = goalInputSchema.parse(input)

  const goal = await goalRepository.upsertGoal(data)

  await logActivity({
    userId: session.user.id,
    action: "goal.save",
    entityType: "Goal",
    entityId: goal.id,
  })

  revalidatePath("/admin/financeiro")
  return { id: goal.id }
}

export async function deleteGoal(id: string) {
  const session = await requireFinancialManage()
  await goalRepository.deleteGoal(id)

  await logActivity({
    userId: session.user.id,
    action: "goal.delete",
    entityType: "Goal",
    entityId: id,
  })

  revalidatePath("/admin/financeiro")
}
