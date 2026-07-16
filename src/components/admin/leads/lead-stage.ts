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
