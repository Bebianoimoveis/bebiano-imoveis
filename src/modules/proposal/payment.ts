// Formas de pagamento de uma proposta e quais campos cada uma pede.
// À vista não tem entrada/financiamento/parcelas — é o valor total.

export const PAYMENT_METHODS = [
  "À vista",
  "Financiado",
  "Financiado + FGTS",
  "Parcelado com a imobiliária",
  "Financiado + parcelas com a imobiliária",
] as const

export type PaymentFields = {
  downPayment: boolean
  financing: boolean
  fgts: boolean
  installments: boolean
}

const NONE: PaymentFields = { downPayment: false, financing: false, fgts: false, installments: false }
const ALL: PaymentFields = { downPayment: true, financing: true, fgts: true, installments: true }

const CONFIG: Record<string, PaymentFields> = {
  "À vista": NONE,
  Financiado: { ...NONE, downPayment: true, financing: true },
  "Financiado + FGTS": { ...NONE, downPayment: true, financing: true, fgts: true },
  "Parcelado com a imobiliária": { ...NONE, downPayment: true, installments: true },
  "Financiado + parcelas com a imobiliária": { ...NONE, downPayment: true, financing: true, installments: true },
}

// Texto livre antigo (propostas já criadas com outro nome) mostra tudo,
// pra não esconder dado que já exista.
export function paymentFields(method: string): PaymentFields {
  return CONFIG[method.trim()] ?? ALL
}
