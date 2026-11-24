// Quanto de fato entrou/saiu: tudo se está pago, só a parte paga se é parcial.
export function receivedAmount(entry: {
  status: string
  amount: { toString(): string } | number
  paidAmount: { toString(): string } | number | null
}): number {
  if (entry.status === "PAID") return Number(entry.amount)
  if (entry.status === "PARTIAL") return Number(entry.paidAmount ?? 0)
  return 0
}
