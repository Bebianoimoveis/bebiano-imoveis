"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { logActivity } from "@/lib/activity-log"
import { brazilDateOnly } from "@/lib/date"
import { goalInputSchema } from "@/modules/goal/schema"
import * as goalRepository from "@/modules/goal/repository"
import {
  MONTH_NAMES,
  MONTH_SHORT,
  computeProgress,
  daysBetween,
  monthsInRange,
  periodLabel,
  resolveGoalPeriod,
  type GoalMetricType,
  type GoalPeriodType,
  type GoalProgress,
  type GoalScopeType,
  type GoalStatus,
} from "@/modules/goal/period"

async function requireFinancialManage() {
  const session = await auth()
  if (!session?.user) throw new Error("Não autenticado.")
  if (!(await can(session.user, "financial.manage"))) {
    throw new Error("Sem permissão para gerenciar metas.")
  }
  return session
}

// Quem vê o quê: com financial.view (gestão), todas as metas. Corretor
// sem essa permissão, só as metas individuais dele — nunca as da
// empresa nem as dos colegas. O recorte é aplicado na consulta, não só
// escondido na tela.
export type GoalAccess =
  | { mode: "all"; canManage: boolean }
  | { mode: "own"; realtorId: string; canManage: false }
  | { mode: "none" }

export async function getGoalAccess(): Promise<GoalAccess> {
  const session = await auth()
  if (!session?.user) return { mode: "none" }
  const [canView, canManage] = await Promise.all([
    can(session.user, "financial.view"),
    can(session.user, "financial.manage"),
  ])
  if (canView) return { mode: "all", canManage }
  if (session.user.realtorId) return { mode: "own", realtorId: session.user.realtorId, canManage: false }
  return { mode: "none" }
}

export type GoalMonthBreakdown = {
  label: string
  fullLabel: string
  realized: number
  target: number
  status: "HIT" | "MISSED" | "CURRENT" | "UPCOMING"
}

export type GoalView = {
  id: string
  title: string | null
  scope: GoalScopeType
  metric: GoalMetricType
  period: GoalPeriodType
  periodLabel: string
  startDate: string
  endDate: string
  // Campos pro formulário de edição, derivados das datas.
  year: number
  month: number
  endMonth: number
  quarter: number
  targetAmount: number
  realtorId: string | null
  realtorName: string | null
  realtorPhotoUrl: string | null
  cityId: string | null
  cityName: string | null
  // Progresso do período "da vez": em metas de todo mês, o mês atual (ou
  // o último/primeiro, se a meta já acabou/ainda não começou).
  currentLabel: string
  progress: GoalProgress
  breakdown: GoalMonthBreakdown[]
  monthsHit: number
  monthsClosed: number
}

function iso(date: Date) {
  return date.toISOString().slice(0, 10)
}

function sumEvents(
  events: goalRepository.GoalEvent[],
  goal: { scope: GoalScopeType; realtorId: string | null; cityId: string | null },
  start: Date,
  end: Date,
  count: boolean
) {
  let total = 0
  for (const event of events) {
    if (event.day < start || event.day > end) continue
    if (goal.scope === "REALTOR" && event.realtorId !== goal.realtorId) continue
    if (goal.scope === "CITY" && event.cityId !== goal.cityId) continue
    total += count ? 1 : event.amount
  }
  return total
}

async function buildGoalViews(goals: goalRepository.GoalWithRefs[]): Promise<GoalView[]> {
  if (goals.length === 0) return []

  const from = new Date(Math.min(...goals.map((goal) => goal.startDate.getTime())))
  const to = new Date(Math.max(...goals.map((goal) => goal.endDate.getTime())))
  const needsSales = goals.some((goal) => goal.metric !== "REVENUE")
  const needsRevenue = goals.some((goal) => goal.metric === "REVENUE")
  const [sales, revenue] = await Promise.all([
    needsSales ? goalRepository.listSaleEvents(from, to) : [],
    needsRevenue ? goalRepository.listRevenueEvents(from, to) : [],
  ])

  const today = brazilDateOnly()

  return goals.map((goal) => {
    const events = goal.metric === "REVENUE" ? revenue : sales
    const isCount = goal.metric === "SALES_COUNT"
    const target = Number(goal.targetAmount)
    const period = goal.period as GoalPeriodType
    const realizedIn = (start: Date, end: Date) => sumEvents(events, goal, start, end, isCount)

    const months = monthsInRange(goal.startDate, goal.endDate).map((month) => ({
      start: month.start < goal.startDate ? goal.startDate : month.start,
      end: month.end > goal.endDate ? goal.endDate : month.end,
      monthStart: month.start,
    }))

    let progress: GoalProgress
    let currentLabel = periodLabel({ period, startDate: goal.startDate, endDate: goal.endDate })
    let breakdown: GoalMonthBreakdown[] = []
    let monthsHit = 0
    let monthsClosed = 0

    if (period === "MONTHLY") {
      breakdown = months.map((month) => {
        const realized = realizedIn(month.start, month.end)
        const status: GoalMonthBreakdown["status"] =
          realized >= target ? "HIT" : today > month.end ? "MISSED" : today < month.start ? "UPCOMING" : "CURRENT"
        if (today > month.end) monthsClosed += 1
        if (realized >= target && today > month.end) monthsHit += 1
        return {
          label: MONTH_SHORT[month.monthStart.getUTCMonth()],
          fullLabel: `${MONTH_NAMES[month.monthStart.getUTCMonth()]} de ${month.monthStart.getUTCFullYear()}`,
          realized,
          target,
          status,
        }
      })
      const currentIndex = Math.max(
        0,
        Math.min(
          months.length - 1,
          months.findIndex((month) => today >= month.start && today <= month.end) === -1
            ? today > goal.endDate
              ? months.length - 1
              : 0
            : months.findIndex((month) => today >= month.start && today <= month.end)
        )
      )
      const current = months[currentIndex]
      progress = computeProgress(breakdown[currentIndex].realized, target, current.start, current.end, today)
      currentLabel = breakdown[currentIndex].fullLabel
    } else {
      const totalDays = daysBetween(goal.startDate, goal.endDate)
      progress = computeProgress(realizedIn(goal.startDate, goal.endDate), target, goal.startDate, goal.endDate, today)
      if (months.length > 1) {
        breakdown = months.map((month) => {
          const realized = realizedIn(month.start, month.end)
          // Meta "ideal" do mês: fatia proporcional aos dias do mês no período.
          const monthTarget = (target * daysBetween(month.start, month.end)) / totalDays
          const status: GoalMonthBreakdown["status"] =
            realized >= monthTarget ? "HIT" : today > month.end ? "MISSED" : today < month.start ? "UPCOMING" : "CURRENT"
          return {
            label: MONTH_SHORT[month.monthStart.getUTCMonth()],
            fullLabel: `${MONTH_NAMES[month.monthStart.getUTCMonth()]} de ${month.monthStart.getUTCFullYear()}`,
            realized,
            target: isCount ? Math.round(monthTarget * 10) / 10 : monthTarget,
            status,
          }
        })
      }
    }

    const startMonth = goal.startDate.getUTCMonth() + 1
    const endMonth = goal.endDate.getUTCMonth() + 1

    return {
      id: goal.id,
      title: goal.title,
      scope: goal.scope,
      metric: goal.metric,
      period,
      periodLabel: periodLabel({ period, startDate: goal.startDate, endDate: goal.endDate }),
      startDate: iso(goal.startDate),
      endDate: iso(goal.endDate),
      year: goal.startDate.getUTCFullYear(),
      month: period === "YEAR_TO_MONTH" ? endMonth : startMonth,
      endMonth,
      quarter: Math.floor((startMonth - 1) / 3) + 1,
      targetAmount: target,
      realtorId: goal.realtorId,
      realtorName: goal.realtor?.user.name ?? null,
      realtorPhotoUrl: goal.realtor?.photoUrl ?? null,
      cityId: goal.cityId,
      cityName: goal.city ? `${goal.city.name} - ${goal.city.state}` : null,
      currentLabel,
      progress,
      breakdown,
      monthsHit,
      monthsClosed,
    }
  })
}

// Todas as metas que tocam o ano escolhido, já com o realizado.
export async function listGoalViews(year: number): Promise<GoalView[]> {
  const access = await getGoalAccess()
  if (access.mode === "none") throw new Error("Sem permissão para acessar metas.")
  const goals = await goalRepository.listGoalsOverlapping(
    new Date(Date.UTC(year, 0, 1)),
    new Date(Date.UTC(year, 11, 31)),
    access.mode === "own" ? access.realtorId : undefined
  )
  return buildGoalViews(goals)
}

// Card "Meta do mês" do painel: a meta valendo hoje, dando preferência
// às mensais (um mês / todo mês), depois às mais curtas. Gestão vê a da
// empresa; corretor vê a dele.
export async function getDashboardGoal(): Promise<{
  goal: GoalView | null
  activeCount: number
  onTrackCount: number
  personal: boolean
  canManage: boolean
} | null> {
  const access = await getGoalAccess()
  if (access.mode === "none") return null

  const today = brazilDateOnly()
  const goals = await buildGoalViews(
    await goalRepository.listGoalsOverlapping(today, today, access.mode === "own" ? access.realtorId : undefined)
  )
  const rank = (goal: GoalView) =>
    goal.period === "MONTH" || goal.period === "MONTHLY" ? 0 : goal.period === "QUARTER" ? 1 : 2
  const metricRank = (goal: GoalView) => (goal.metric === "SALES_VALUE" ? 0 : goal.metric === "REVENUE" ? 1 : 2)
  const candidates = goals
    .filter((goal) => (access.mode === "own" ? true : goal.scope === "COMPANY"))
    .sort((a, b) => rank(a) - rank(b) || metricRank(a) - metricRank(b))

  const onTrack: GoalStatus[] = ["HIT", "ON_TRACK"]
  return {
    goal: candidates[0] ?? null,
    activeCount: goals.length,
    onTrackCount: goals.filter((goal) => onTrack.includes(goal.progress.status)).length,
    personal: access.mode === "own",
    canManage: access.canManage,
  }
}

export async function saveGoal(input: unknown): Promise<{ id?: string; error?: string }> {
  const session = await requireFinancialManage()
  const parsed = goalInputSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  const data = parsed.data

  const { startDate, endDate } = resolveGoalPeriod(data)
  const writeData: goalRepository.GoalWriteData = {
    title: data.title ?? null,
    scope: data.scope,
    metric: data.metric,
    period: data.period,
    startDate,
    endDate,
    year: startDate.getUTCFullYear(),
    month: data.period === "MONTH" ? startDate.getUTCMonth() + 1 : null,
    targetAmount: data.targetAmount,
    realtorId: data.scope === "REALTOR" ? (data.realtorId ?? null) : null,
    cityId: data.scope === "CITY" ? (data.cityId ?? null) : null,
  }

  const goal = data.id
    ? await goalRepository.updateGoal(data.id, writeData)
    : await goalRepository.createGoal(writeData)

  await logActivity({
    userId: session.user.id,
    action: "goal.save",
    entityType: "Goal",
    entityId: goal.id,
  })

  revalidatePath("/admin/metas")
  revalidatePath("/admin/financeiro")
  revalidatePath("/admin")
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

  revalidatePath("/admin/metas")
  revalidatePath("/admin/financeiro")
  revalidatePath("/admin")
}
