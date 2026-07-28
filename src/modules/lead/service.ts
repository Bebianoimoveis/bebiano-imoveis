import type { ContactRequestInput, VisitRequestInput } from "@/modules/lead/schema"
import * as leadRepository from "@/modules/lead/repository"
import type { LeadAttributionInput } from "@/modules/lead/repository"
import * as appointmentRepository from "@/modules/appointment/repository"
import * as attributionService from "@/modules/attribution/service"
import type { ResolvedRealtorForLead } from "@/modules/attribution/service"

class SpamRejectedError extends Error {}

const MIN_FILL_TIME_MS = 2000

// Heurística simples e sem dependências externas: bots costumam preencher
// o campo honeypot (invisível para humanos) e enviar o formulário quase
// instantaneamente após ele aparecer na página.
function assertLooksHuman(input: { honeypot?: string; startedAt: number }) {
  if (input.honeypot) {
    throw new SpamRejectedError("Envio rejeitado.")
  }

  const elapsed = Date.now() - input.startedAt
  if (elapsed < MIN_FILL_TIME_MS) {
    throw new SpamRejectedError("Envio rejeitado.")
  }
}

// Achata o resultado da atribuição pro formato que os repositórios
// esperam gravar no Lead — só um lugar decide "qual corretor" (attribution
// service), aqui só reformata.
function toLeadAttribution(resolved: ResolvedRealtorForLead): LeadAttributionInput {
  return {
    realtorId: resolved.realtorId,
    visitorId: resolved.attribution?.visitorId,
    referralSource: resolved.attribution?.referralSource,
    landingUrl: resolved.attribution?.landingUrl,
    utmSource: resolved.attribution?.utmSource,
    utmMedium: resolved.attribution?.utmMedium,
    utmCampaign: resolved.attribution?.utmCampaign,
  }
}

export async function submitPublicContactRequest(
  input: ContactRequestInput,
  ipAddress?: string
) {
  assertLooksHuman(input)

  const resolved = await attributionService.resolveRealtorForNewLead(input.propertyId)

  return leadRepository.createContactRequestWithLead({
    name: input.name,
    phone: input.phone,
    email: input.email,
    message: input.message,
    propertyId: input.propertyId,
    source: input.source,
    ipAddress,
    attribution: toLeadAttribution(resolved),
  })
}

export async function submitPublicVisitRequest(input: VisitRequestInput) {
  assertLooksHuman(input)

  // preferredDate: "2026-08-20", preferredTime: "14:00" — offset de
  // Brasília (-03:00) explícito. Sem isso, em produção (runtime da Vercel
  // em UTC) "14:00" seria interpretado como 14h UTC = 11h em Brasília,
  // um erro de 3h no horário agendado.
  const scheduledAt = new Date(
    `${input.preferredDate}T${input.preferredTime}:00-03:00`
  )
  if (Number.isNaN(scheduledAt.getTime())) {
    throw new Error("Data ou horário inválido.")
  }

  const resolved = await attributionService.resolveRealtorForNewLead(input.propertyId)

  return appointmentRepository.createVisitRequestWithLead({
    name: input.name,
    phone: input.phone,
    propertyId: input.propertyId,
    scheduledAt,
    message: input.message ?? undefined,
    attribution: toLeadAttribution(resolved),
  })
}

export { SpamRejectedError }
