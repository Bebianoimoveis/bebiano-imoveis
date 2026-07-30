import type { LeadStage } from "@/generated/prisma/client"

export const LEAD_STAGE_ORDER: LeadStage[] = [
  "NEW",
  "FIRST_CONTACT",
  "QUALIFIED",
  "VISIT_SCHEDULED",
  "PROPOSAL",
  "NEGOTIATION",
  "DOCUMENTATION",
  "CLOSED",
  "LOST",
]

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  NEW: "Novo lead",
  FIRST_CONTACT: "Primeiro contato",
  QUALIFIED: "Qualificado",
  VISIT_SCHEDULED: "Visita agendada",
  PROPOSAL: "Proposta",
  NEGOTIATION: "Negociação",
  DOCUMENTATION: "Documentação",
  CLOSED: "Fechado",
  LOST: "Perdido",
}

// Cor por estágio — usada na bolinha/faixa do cabeçalho da coluna do
// Kanban. `dot` é a cor sólida (bolinha), `bg`/`text` tingem o cabeçalho
// da coluna sem pintar o quadro inteiro de marsala (marsala fica só nos
// elementos de marca — botões, indicador de destaque etc.).
export const LEAD_STAGE_COLORS: Record<LeadStage, { dot: string; bg: string; text: string }> = {
  NEW: { dot: "bg-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-500" },
  FIRST_CONTACT: { dot: "bg-blue-500", bg: "bg-blue-500/10", text: "text-blue-500" },
  QUALIFIED: { dot: "bg-amber-500", bg: "bg-amber-500/10", text: "text-amber-500" },
  VISIT_SCHEDULED: { dot: "bg-orange-500", bg: "bg-orange-500/10", text: "text-orange-500" },
  PROPOSAL: { dot: "bg-violet-500", bg: "bg-violet-500/10", text: "text-violet-500" },
  NEGOTIATION: { dot: "bg-fuchsia-500", bg: "bg-fuchsia-500/10", text: "text-fuchsia-500" },
  DOCUMENTATION: { dot: "bg-cyan-500", bg: "bg-cyan-500/10", text: "text-cyan-500" },
  CLOSED: { dot: "bg-green-600", bg: "bg-green-600/10", text: "text-green-600" },
  LOST: { dot: "bg-red-500", bg: "bg-red-500/10", text: "text-red-500" },
}
