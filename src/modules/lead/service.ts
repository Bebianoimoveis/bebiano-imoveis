import type { ContactRequestInput, VisitRequestInput } from "@/modules/lead/schema"
import * as leadRepository from "@/modules/lead/repository"
import * as appointmentRepository from "@/modules/appointment/repository"

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

export async function submitPublicContactRequest(
  input: ContactRequestInput,
  ipAddress?: string
) {
  assertLooksHuman(input)

  return leadRepository.createContactRequestWithLead({
    name: input.name,
    phone: input.phone,
    email: input.email,
    message: input.message,
    propertyId: input.propertyId,
    source: input.source,
    ipAddress,
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

  return appointmentRepository.createVisitRequestWithLead({
    name: input.name,
    phone: input.phone,
    propertyId: input.propertyId,
    scheduledAt,
    message: input.message ?? undefined,
  })
}

export { SpamRejectedError }
