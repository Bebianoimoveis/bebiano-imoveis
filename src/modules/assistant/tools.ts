import type { FunctionDeclaration } from "@google/genai"

import { getDashboardMetrics } from "@/modules/report/actions"
import { getLeadCrmStats, listAdminLeads } from "@/modules/lead/actions"
import { getClientCrmStats } from "@/modules/client/actions"
import { getPropertyPortfolioStats } from "@/modules/property/actions"
import { getFinancialKpis } from "@/modules/financial/actions"
import { getProposalCrmStats, listAdminProposals } from "@/modules/proposal/actions"
import { getAppointmentStats, listAdminAppointments } from "@/modules/appointment/actions"

// Cada ferramenta é só uma casca fina em cima de uma action que já existe
// e já aplica a mesma permissão/escopo por corretor do resto do painel —
// o modelo nunca encosta no banco diretamente. Como essas actions chamam
// auth() por conta própria, rodam automaticamente com a sessão de quem
// está perguntando (mesmo padrão já usado em report/actions.ts).
export const ASSISTANT_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "get_dashboard_overview",
    description:
      "Visão geral do painel: imóveis publicados/indisponíveis, novos leads, visitas agendadas, propostas abertas, vendas e receita dos últimos 6 meses, leads por origem e por estágio do funil, imóveis mais visualizados.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        periodDays: { type: "number", description: "Janela em dias para leads/propostas novos. Padrão 30." },
      },
    },
  },
  {
    name: "get_leads_stats",
    description:
      "Estatísticas de leads: total, novos no período, por estágio do funil, por origem, taxa de conversão.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        periodDays: { type: "number", description: "Janela em dias. Padrão 30." },
      },
    },
  },
  {
    name: "get_leads_needing_attention",
    description:
      "Lista os leads que precisam de atenção agora, já com prioridade calculada: alta (proposta aberta vinculada, ou retorno combinado já vencido) ou média (mais de 3 dias sem interação). Use para perguntas como 'quais leads devo atender primeiro', 'quem está sem retorno', 'quais leads merecem atenção', ou como parte de um resumo do dia.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Quantidade máxima de leads a retornar. Padrão 10." },
      },
    },
  },
  {
    name: "get_clients_stats",
    description:
      "Estatísticas de clientes: total, ativos, novos no período, VIP, por tipo (comprador/vendedor/locatário/investidor).",
    parametersJsonSchema: {
      type: "object",
      properties: {
        periodDays: { type: "number", description: "Janela em dias. Padrão 30." },
      },
    },
  },
  {
    name: "get_properties_stats",
    description: "Estatísticas do portfólio de imóveis: publicados, indisponíveis, vendidos, total de leads recebidos.",
    parametersJsonSchema: { type: "object", properties: {} },
  },
  {
    name: "get_financial_kpis",
    description:
      "Indicadores financeiros: receita e despesa do mês atual e do anterior, receita anual acumulada, valores pendentes de recebimento/pagamento. Só funciona se quem perguntar tiver permissão financeira.",
    parametersJsonSchema: { type: "object", properties: {} },
  },
  {
    name: "get_proposals_stats",
    description: "Estatísticas de propostas: total por status, valor total, taxa de conversão, propostas expiradas.",
    parametersJsonSchema: { type: "object", properties: {} },
  },
  {
    name: "get_agenda_today",
    description: "Contagens da agenda: compromissos de hoje e da semana, taxa de comparecimento, pendentes de confirmação.",
    parametersJsonSchema: { type: "object", properties: {} },
  },
  {
    name: "get_today_agenda_detail",
    description:
      "Lista detalhada dos compromissos de hoje (horário, tipo, com quem, imóvel) — use quando pedirem a agenda de hoje de verdade, não só a contagem (ex.: 'o que tenho hoje', 'qual minha próxima visita', ou como parte de um resumo do dia).",
    parametersJsonSchema: { type: "object", properties: {} },
  },
]

type ToolArgs = { periodDays?: number; limit?: number }

async function safeCall(label: string, fn: () => Promise<unknown>) {
  try {
    return await fn()
  } catch (error) {
    // Ferramenta indisponível pra esse usuário (ex.: sem financial.view) —
    // devolve um erro estruturado pro modelo explicar em vez de travar a
    // resposta inteira.
    return { error: error instanceof Error ? error.message : `Não foi possível obter ${label}.` }
  }
}

const ACTIVE_LEAD_STAGES = new Set([
  "NEW",
  "FIRST_CONTACT",
  "QUALIFIED",
  "VISIT_SCHEDULED",
  "PROPOSAL",
  "NEGOTIATION",
  "DOCUMENTATION",
])

const OPEN_PROPOSAL_STATUSES_EXCLUDED = new Set(["REJECTED", "COMPLETED", "CANCELED"])

// Prioridade 100% derivada de campos reais (lastInteractionAt, nextActionAt,
// proposta aberta vinculada) — nunca um "achismo" do modelo. Reaproveita
// listAdminLeads/listAdminProposals já existentes (mesmo escopo por
// corretor/permissão que as telas de Leads e Propostas já aplicam).
async function getLeadsNeedingAttention(limit: number) {
  const [leads, proposals] = await Promise.all([listAdminLeads({}), listAdminProposals({})])

  const openProposalLeadIds = new Set(
    proposals.filter((p) => p.leadId && !OPEN_PROPOSAL_STATUSES_EXCLUDED.has(p.status)).map((p) => p.leadId)
  )

  const now = Date.now()
  const prioritized = leads
    .filter((lead) => ACTIVE_LEAD_STAGES.has(lead.stage))
    .map((lead) => {
      const daysSinceLastInteraction = Math.floor((now - new Date(lead.lastInteractionAt).getTime()) / 86400000)
      const nextActionOverdue = lead.nextActionAt ? new Date(lead.nextActionAt).getTime() < now : false
      const hasOpenProposal = openProposalLeadIds.has(lead.id)

      let priority: "alta" | "media" | "baixa" = "baixa"
      if (hasOpenProposal || nextActionOverdue) priority = "alta"
      else if (daysSinceLastInteraction >= 3) priority = "media"

      return {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        stage: lead.stage,
        daysSinceLastInteraction,
        nextActionOverdue,
        hasOpenProposal,
        realtor: lead.realtor?.user.name ?? null,
        priority,
      }
    })
    .filter((lead) => lead.priority !== "baixa")
    .sort((a, b) => {
      const order = { alta: 0, media: 1, baixa: 2 } as const
      if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority]
      return b.daysSinceLastInteraction - a.daysSinceLastInteraction
    })
    .slice(0, limit)

  return {
    leads: prioritized,
    totalActiveLeads: leads.filter((lead) => ACTIVE_LEAD_STAGES.has(lead.stage)).length,
  }
}

async function getTodayAgendaDetail() {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  const appointments = await listAdminAppointments({ from: start, to: end })

  return appointments.map((appointment) => ({
    id: appointment.id,
    time: new Date(appointment.scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    type: appointment.type,
    status: appointment.status,
    with: appointment.lead?.name ?? appointment.client?.name ?? null,
    property: appointment.property ? `${appointment.property.code} - ${appointment.property.title}` : null,
    realtor: appointment.realtor.user.name,
  }))
}

export async function executeAssistantTool(name: string, args: ToolArgs): Promise<unknown> {
  switch (name) {
    case "get_dashboard_overview":
      return safeCall("a visão geral", () => getDashboardMetrics(args.periodDays ?? 30))
    case "get_leads_stats":
      return safeCall("as estatísticas de leads", () => getLeadCrmStats({}, args.periodDays ?? 30))
    case "get_leads_needing_attention":
      return safeCall("os leads que precisam de atenção", () => getLeadsNeedingAttention(args.limit ?? 10))
    case "get_clients_stats":
      return safeCall("as estatísticas de clientes", () => getClientCrmStats({}, args.periodDays ?? 30))
    case "get_properties_stats":
      return safeCall("as estatísticas de imóveis", () => getPropertyPortfolioStats({}))
    case "get_financial_kpis":
      return safeCall("os indicadores financeiros", () => getFinancialKpis({}))
    case "get_proposals_stats":
      return safeCall("as estatísticas de propostas", () => getProposalCrmStats({}))
    case "get_agenda_today":
      return safeCall("a agenda", () => getAppointmentStats({}))
    case "get_today_agenda_detail":
      return safeCall("os compromissos de hoje", () => getTodayAgendaDetail())
    default:
      return { error: `Ferramenta desconhecida: ${name}` }
  }
}
