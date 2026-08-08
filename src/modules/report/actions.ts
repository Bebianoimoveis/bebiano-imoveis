"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import * as reportRepository from "@/modules/report/repository"
import { listAdminAppointments } from "@/modules/appointment/actions"
import { listAdminUpcomingBirthdays } from "@/modules/client/actions"
import { getDashboardFinancialAlerts } from "@/modules/financial/actions"
import { listAdminProposalsExpiringSoon } from "@/modules/proposal/actions"

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new Error("Não autenticado.")
  return session
}

// Cada recurso usa a mesma permissão "*.view.all" já existente nos outros
// módulos para decidir se o dashboard mostra números da imobiliária
// inteira ou só do corretor logado.
async function buildScopes(session: Awaited<ReturnType<typeof requireSession>>) {
  const [propertyAll, leadAll, appointmentAll, proposalAll, contractAll] =
    await Promise.all([
      can(session.user, "property.view.all"),
      can(session.user, "lead.view.all"),
      can(session.user, "appointment.view.all"),
      can(session.user, "proposal.view.all"),
      can(session.user, "contract.view.all"),
    ])

  const realtorId = session.user.realtorId ?? "__none__"

  return {
    property: propertyAll ? {} : { realtorId },
    lead: leadAll ? {} : { realtorId },
    appointment: appointmentAll ? {} : { realtorId },
    proposal: proposalAll ? {} : { realtorId },
    contract: contractAll ? {} : { realtorId },
  }
}

// periodDays controla a janela do filtro de período do dashboard (7/30/90
// dias) — cada KPI temporal (leads, propostas) é comparado com a janela
// imediatamente anterior de mesmo tamanho, pra mostrar crescimento real
// em vez de só o número absoluto.
export async function getDashboardMetrics(periodDays = 30) {
  const session = await requireSession()
  const scopes = await buildScopes(session)

  const now = new Date()
  const periodFrom = new Date(now)
  periodFrom.setDate(periodFrom.getDate() - periodDays)
  const previousFrom = new Date(periodFrom)
  previousFrom.setDate(previousFrom.getDate() - periodDays)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const canViewReports = await can(session.user, "report.view")

  const [
    propertyStatus,
    newLeads,
    previousNewLeads,
    upcomingAppointments,
    openProposals,
    newProposals,
    previousNewProposals,
    salesInPeriod,
    salesByMonthRaw,
    leadsByOrigin,
    leadsByStage,
    topViewed,
    activity,
  ] = await Promise.all([
    reportRepository.countPropertiesByStatus(scopes.property),
    reportRepository.countLeadsInRange(scopes.lead, periodFrom, now),
    reportRepository.countLeadsInRange(scopes.lead, previousFrom, periodFrom),
    reportRepository.countUpcomingAppointments(scopes.appointment),
    reportRepository.countOpenProposals(scopes.proposal),
    reportRepository.countProposalsInRange(scopes.proposal, periodFrom, now),
    reportRepository.countProposalsInRange(scopes.proposal, previousFrom, periodFrom),
    reportRepository.sumSalesInPeriod(scopes.contract, monthStart, monthEnd),
    reportRepository.salesByMonth(scopes.contract, 6),
    reportRepository.leadsByOrigin(scopes.lead),
    reportRepository.leadsByStage(scopes.lead),
    reportRepository.topViewedProperties(scopes.property, 5),
    canViewReports
      ? reportRepository.recentActivity(10)
      : reportRepository.recentActivity(10, { userId: session.user.id }),
  ])

  return {
    periodDays,
    propertyStatus,
    newLeads: { value: newLeads, previousValue: previousNewLeads },
    upcomingAppointments,
    openProposals,
    newProposals: { value: newProposals, previousValue: previousNewProposals },
    salesInPeriod,
    salesByMonth: [...salesByMonthRaw.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data })),
    leadsByOrigin,
    leadsByStage,
    topViewed,
    activity,
  }
}

// Coluna direita do Dashboard (Agenda de hoje/Aniversários/Radar de
// prazos/Vencimentos/Alertas). Cada fonte já faz sua própria checagem de
// permissão e escopo por corretor — getDashboardFinancialAlerts exige
// "financial.view", que nem todo usuário tem, então é a única chamada
// envolta em catch (widget some pra quem não tem acesso, resto do painel
// segue normal).
export async function getDashboardSidePanel() {
  await requireSession()

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const [todayAppointments, birthdays, expiringProposals, financialAlerts] = await Promise.all([
    listAdminAppointments({ from: todayStart, to: todayEnd }),
    listAdminUpcomingBirthdays(7),
    listAdminProposalsExpiringSoon(7),
    getDashboardFinancialAlerts().catch(() => null),
  ])

  const urgentProposals = expiringProposals.filter((proposal) => {
    if (!proposal.validUntil) return false
    return new Date(proposal.validUntil).getTime() - now.getTime() <= 2 * 24 * 60 * 60 * 1000
  })

  const alerts = [
    financialAlerts && financialAlerts.overdueCount > 0
      ? {
          id: "overdue-financial",
          label: `${financialAlerts.overdueCount} lançamento${financialAlerts.overdueCount > 1 ? "s" : ""} financeiro${financialAlerts.overdueCount > 1 ? "s" : ""} atrasado${financialAlerts.overdueCount > 1 ? "s" : ""}`,
          href: "/admin/financeiro",
        }
      : null,
    urgentProposals.length > 0
      ? {
          id: "proposals-expiring",
          label: `${urgentProposals.length} proposta${urgentProposals.length > 1 ? "s" : ""} vencendo em até 2 dias`,
          href: "/admin/propostas",
        }
      : null,
  ].filter((alert): alert is { id: string; label: string; href: string } => alert !== null)

  return {
    todayAppointments,
    birthdays,
    expiringProposals,
    financialAlerts,
    alerts,
  }
}

export async function getSalesReport(months: number) {
  const session = await requireSession()
  if (!(await can(session.user, "report.view"))) {
    throw new Error("Sem permissão para acessar relatórios.")
  }

  const scopes = await buildScopes(session)
  const buckets = await reportRepository.salesByMonth(scopes.contract, months)

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }))
}

export async function getLeadsOriginReport() {
  const session = await requireSession()
  if (!(await can(session.user, "report.view"))) {
    throw new Error("Sem permissão para acessar relatórios.")
  }

  const scopes = await buildScopes(session)
  return reportRepository.leadsByOrigin(scopes.lead)
}
