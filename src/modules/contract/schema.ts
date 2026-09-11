import { z } from "zod"

// Cadastro manual de contrato (sem proposta vinculada) — ex: negócio
// fechado fora do sistema, contrato antigo sendo migrado pra cá.
export const manualContractInputSchema = z.object({
  clientId: z.string().min(1, "Selecione o cliente."),
  propertyId: z.string().min(1, "Informe o imóvel."),
  realtorId: z.string().min(1, "Selecione o corretor."),
  value: z.coerce.number().positive("Informe um valor válido."),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "CANCELED"]).default("DRAFT"),
  fileUrl: z.string().url().optional(),
})

export type ManualContractInput = z.infer<typeof manualContractInputSchema>
