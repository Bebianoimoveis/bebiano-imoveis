"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { startOfDayBrazil, endOfDayBrazil } from "@/lib/date"
import { getGeminiClient, isGeminiConfigured, GEMINI_MODEL, withGeminiRetry } from "@/lib/gemini"
import * as reportRepository from "@/modules/report/repository"
import { listAdminAppointments } from "@/modules/appointment/actions"
import { listAdminUpcomingBirthdays } from "@/modules/client/actions"
import {
  getDashboardFinancialAlerts,
  getFinancialMonthlySeries,
  getFinancialCommissionsByRealtor,
} from "@/modules/financial/actions"
import { getFinancialForecast } from "@/modules/assistant/tools"
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
  const todayStart = startOfDayBrazil(now)
  const todayEnd = endOfDayBrazil(now)

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

async function requireReportView(session: Awaited<ReturnType<typeof requireSession>>) {
  if (!(await can(session.user, "report.view"))) {
    throw new Error("Sem permissão para acessar relatórios.")
  }
}

// Levantamento por corretor é intencionalmente mais restrito que o resto
// da Inteligência de Negócios: usa `user.manage` (hoje, só o papel Admin
// tem essa permissão — nem Gerente/Financeiro legados) em vez de
// `report.view`, porque é sobre desempenho individual de cada corretor,
// não um número agregado da imobiliária.
export async function canViewRealtorBreakdown() {
  const session = await auth()
  if (!session?.user) return false
  return can(session.user, "user.manage")
}

export async function getNewLeadsAndClientsByRealtor(month: number, year: number) {
  const session = await requireSession()
  if (!(await can(session.user, "user.manage"))) {
    throw new Error("Sem permissão para ver o levantamento por corretor.")
  }

  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999)

  return reportRepository.countNewLeadsAndClientsByRealtor(monthStart, monthEnd)
}

// Página "Inteligência de Negócios" — visão consolidada de vendas, leads e
// portfólio, no mesmo nível de detalhe da Gestão Financeira (KPIs +
// gráficos), mas sem se sobrepor a ela: nada de receita/despesa aqui, isso
// já vive no módulo Financeiro.
export async function getBusinessReport(months = 6) {
  const session = await requireSession()
  await requireReportView(session)
  const scopes = await buildScopes(session)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const periodFrom = new Date(now)
  periodFrom.setDate(periodFrom.getDate() - 30)
  const previousFrom = new Date(periodFrom)
  previousFrom.setDate(previousFrom.getDate() - 30)

  const [
    propertyStatus,
    salesByMonthRaw,
    salesThisMonth,
    leadsByOrigin,
    leadsByStage,
    topViewed,
    newLeads,
    previousNewLeads,
  ] = await Promise.all([
    reportRepository.countPropertiesByStatus(scopes.property),
    reportRepository.salesByMonth(scopes.contract, months),
    reportRepository.sumSalesInPeriod(scopes.contract, monthStart, monthEnd),
    reportRepository.leadsByOrigin(scopes.lead),
    reportRepository.leadsByStage(scopes.lead),
    reportRepository.topViewedProperties(scopes.property, 5),
    reportRepository.countLeadsInRange(scopes.lead, periodFrom, now),
    reportRepository.countLeadsInRange(scopes.lead, previousFrom, periodFrom),
  ])

  const totalLeads = leadsByOrigin.reduce((sum, item) => sum + item.count, 0)
  const closedLeads = leadsByStage.find((item) => item.stage === "CLOSED")?.count ?? 0

  return {
    propertyStatus,
    salesByMonth: [...salesByMonthRaw.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data })),
    // .total vem como Decimal do Prisma — precisa virar number antes de
    // cruzar pra um Client Component (mesma regra de Server Action:
    // Decimal não serializa, quebra a promise no client sem erro visível).
    salesThisMonth: { total: Number(salesThisMonth.total), count: salesThisMonth.count },
    leadsByOrigin,
    leadsByStage,
    topViewed,
    newLeads: { value: newLeads, previousValue: previousNewLeads },
    totalLeads,
    conversionRate: totalLeads > 0 ? closedLeads / totalLeads : 0,
  }
}

function toCsvValue(value: string | number) {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export async function exportBusinessReportCsv(months = 6) {
  const session = await requireSession()
  await requireReportView(session)
  const scopes = await buildScopes(session)

  const buckets = await reportRepository.salesByMonth(scopes.contract, months)
  const rows = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b))

  const header = ["Mês", "Contratos", "Valor total"]
  const body = rows.map(([month, data]) => [month, data.count, data.total])

  return [header, ...body].map((row) => row.map(toCsvValue).join(",")).join("\n")
}

const INSIGHTS_SYSTEM_INSTRUCTION = `Você é a Bebiano IA, gerando uma análise de negócio pra Bebiano Imóveis a partir de dados reais do sistema, enviados em JSON na mensagem do usuário.

FORMATO: texto simples, sem markdown nenhum (nada de **negrito**, #títulos, listas com * ou -). Organize a resposta em blocos: um título curto em maiúsculas seguido de dois-pontos (ex: "VISÃO GERAL:"), com frases normais embaixo, separados por uma linha em branco entre blocos. Valores em R$ 890.000,00, datas em 09/08/2026, percentuais em 42%.

REGRAS: use só os números do JSON fornecido — nunca invente ou estime um valor que não esteja lá. Deixe sempre claro o que é dado real e o que é estimativa (o campo "forecast", quando presente, já vem calculado — cite o método dele, nunca calcule uma previsão nova por conta própria). Se um bloco de dado não vier no JSON (ex: sem "financial" ou sem "realtorPerformance"), simplesmente não fale sobre esse assunto — não invente o conteúdo nem peça desculpa pela ausência. Seja direto e específico, nunca genérico ou com frases de efeito.

ESTRUTURA esperada (adapte / pule blocos conforme o que os dados permitirem):
VISÃO GERAL: resumo do momento do negócio — portfólio, leads, conversão, vendas do período.
FATURAMENTO MENSAL: leitura da série de receita/despesa mês a mês (campo financial.monthlySeries) — tendência, meses fortes/fracos.
PREVISÃO: o que financial.forecast indica pro fechamento do mês atual, deixando explícito que é estimativa.
COMPARATIVO POR CORRETOR: só se realtorPerformance vier no JSON — quem vendeu/rendeu mais (commissions), quem converte mais (conversion), alguma discrepância que mereça atenção.
SUGESTÕES: de 3 a 5 ações concretas e priorizadas, cada uma amarrada a um dado específico citado acima — nunca conselho genérico de mercado.`

// Painel "Análise com IA" da Inteligência de Negócios — gerado sob
// demanda (custa tempo/tokens), nunca automático no load da página.
// Financeiro e comparativo por corretor só entram no JSON enviado à IA
// se a pessoa logada realmente tiver acesso a esses dados (mesmo gate
// já usado no resto do painel) — nunca vazam por essa via alternativa.
export async function generateBusinessInsights(): Promise<{ text: string } | { error: string }> {
  const session = await requireSession()
  await requireReportView(session)

  if (!isGeminiConfigured()) {
    return {
      error:
        "A IA ainda não foi configurada neste sistema. Peça para o administrador adicionar a chave GEMINI_API_KEY nas variáveis de ambiente do projeto.",
    }
  }

  const [business, canSeeRealtors] = await Promise.all([getBusinessReport(12), canViewRealtorBreakdown()])

  let financial: { monthlySeries: unknown; forecast: unknown } | null = null
  try {
    const [monthlySeries, forecast] = await Promise.all([getFinancialMonthlySeries({}), getFinancialForecast()])
    financial = { monthlySeries, forecast }
  } catch {
    financial = null
  }

  let realtorPerformance: { conversion: unknown; commissions: unknown | null } | null = null
  if (canSeeRealtors) {
    const conversion = await reportRepository.getLeadConversionByRealtor()
    let commissions: unknown | null = null
    try {
      commissions = await getFinancialCommissionsByRealtor()
    } catch {
      commissions = null
    }
    realtorPerformance = { conversion, commissions }
  }

  const payload = { business, financial, realtorPerformance }

  try {
    const ai = getGeminiClient()
    const chat = ai.chats.create({
      model: GEMINI_MODEL,
      config: { systemInstruction: INSIGHTS_SYSTEM_INSTRUCTION },
    })
    // Round-trip por JSON garante que Decimal/Date (vindos das actions do
    // Prisma) virem string simples antes de ir pro Gemini, mesmo padrão
    // usado nas respostas de ferramenta do assistente de chat.
    const response = await withGeminiRetry(() =>
      chat.sendMessage({ message: JSON.stringify(JSON.parse(JSON.stringify(payload))) })
    )
    return { text: response.text || "Não consegui gerar a análise agora. Tente novamente." }
  } catch (error) {
    console.error("generateBusinessInsights failed", error)
    return { error: "Ocorreu um erro ao consultar a IA. Tente novamente em instantes." }
  }
}
