"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import * as reportRepository from "@/modules/report/repository"

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

export async function getDashboardMetrics() {
  const session = await requireSession()
  const scopes = await buildScopes(session)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const canViewReports = await can(session.user, "report.view")

  const [
    propertyStatus,
    newLeads,
    upcomingAppointments,
    openProposals,
    salesInPeriod,
    leadsByOrigin,
    topViewed,
    activity,
  ] = await Promise.all([
    reportRepository.countPropertiesByStatus(scopes.property),
    reportRepository.countNewLeads(scopes.lead, 30),
    reportRepository.countUpcomingAppointments(scopes.appointment),
    reportRepository.countOpenProposals(scopes.proposal),
    reportRepository.sumSalesInPeriod(scopes.contract, monthStart, monthEnd),
    reportRepository.leadsByOrigin(scopes.lead),
    reportRepository.topViewedProperties(scopes.property, 5),
    canViewReports
      ? reportRepository.recentActivity(10)
      : reportRepository.recentActivity(10, { userId: session.user.id }),
  ])

  return {
    propertyStatus,
    newLeads,
    upcomingAppointments,
    openProposals,
    salesInPeriod,
    leadsByOrigin,
    topViewed,
    activity,
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
