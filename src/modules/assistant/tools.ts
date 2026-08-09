import type { FunctionDeclaration } from "@google/genai"

import { getDashboardMetrics } from "@/modules/report/actions"
import { getLeadCrmStats } from "@/modules/lead/actions"
import { getClientCrmStats } from "@/modules/client/actions"
import { getPropertyPortfolioStats } from "@/modules/property/actions"
import { getFinancialKpis } from "@/modules/financial/actions"
import { getProposalCrmStats } from "@/modules/proposal/actions"
import { getAppointmentStats } from "@/modules/appointment/actions"

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
    description: "Compromissos de hoje e da semana na agenda, taxa de comparecimento, pendentes de confirmação.",
    parametersJsonSchema: { type: "object", properties: {} },
  },
]

type ToolArgs = { periodDays?: number }

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

export async function executeAssistantTool(name: string, args: ToolArgs): Promise<unknown> {
  switch (name) {
    case "get_dashboard_overview":
      return safeCall("a visão geral", () => getDashboardMetrics(args.periodDays ?? 30))
    case "get_leads_stats":
      return safeCall("as estatísticas de leads", () => getLeadCrmStats({}, args.periodDays ?? 30))
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
    default:
      return { error: `Ferramenta desconhecida: ${name}` }
  }
}
