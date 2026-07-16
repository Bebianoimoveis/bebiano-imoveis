import type { ContactRequestInput } from "@/modules/lead/schema"
import * as leadRepository from "@/modules/lead/repository"

class SpamRejectedError extends Error {}

const MIN_FILL_TIME_MS = 2000

// Heurística simples e sem dependências externas: bots costumam preencher
// o campo honeypot (invisível para humanos) e enviar o formulário quase
// instantaneamente após ele aparecer na página.
function assertLooksHuman(input: ContactRequestInput) {
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

export { SpamRejectedError }
