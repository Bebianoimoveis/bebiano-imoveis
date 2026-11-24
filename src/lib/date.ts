// O servidor (Vercel) roda em UTC, mas o negócio é 100% Brasil —
// `date.setHours(0,0,0,0)` acha meia-noite UTC, não meia-noite em
// Brasília, e desalinha em até 3h qualquer consulta de "hoje"/"esta
// semana" (compromissos à noite sumiam do "hoje", por exemplo). Brasília
// é sempre UTC-3 (sem horário de verão desde 2019), então um offset fixo
// resolve, sem precisar de Intl/timezone database.
const BRAZIL_OFFSET_MS = 3 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

// "Que dia é hoje em Brasília" — devolve meia-noite UTC do dia
// correspondente. Usar pra comparar com campos "só data" (dueDate,
// validUntil...), guardados como meia-noite UTC pura por
// `z.coerce.date()` sobre um <input type="date"> sem hora, ou pra
// identificar um dia (ex: o `?date=` da Agenda) antes de virar janela
// real com `brazilDayWindow`.
export function brazilDateOnly(date: Date = new Date()): Date {
  const shifted = new Date(date.getTime() - BRAZIL_OFFSET_MS)
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()))
}

// A partir de uma identidade de dia (meia-noite UTC, como a que
// `brazilDateOnly` devolve), monta a janela real em UTC do dia em
// Brasília — início às 03:00 UTC (meia-noite local) até 02:59:59.999 UTC
// do dia seguinte. Usar pra filtrar campos com hora de verdade
// (scheduledAt, createdAt...).
export function brazilDayWindow(dateOnly: Date): { from: Date; to: Date } {
  const from = new Date(
    Date.UTC(dateOnly.getUTCFullYear(), dateOnly.getUTCMonth(), dateOnly.getUTCDate(), 3, 0, 0, 0)
  )
  return { from, to: new Date(from.getTime() + DAY_MS - 1) }
}

// Janela real (UTC) do mês em Brasília. month de 1 a 12; aceita 0 ou 13
// (mês anterior/seguinte).
export function brazilMonthWindow(year: number, month: number): { from: Date; to: Date } {
  const from = new Date(Date.UTC(year, month - 1, 1, 3))
  return { from, to: new Date(Date.UTC(year, month, 1, 3) - 1) }
}

// Filtro "de/até" vindo de <input type="date"> (dia puro) aplicado a um
// campo com hora de verdade: cobre o dia inteiro em Brasília nas duas pontas.
export function brazilDateRange(from?: Date, to?: Date): { gte?: Date; lte?: Date } | undefined {
  if (!from && !to) return undefined
  return { gte: from && brazilDayWindow(from).from, lte: to && brazilDayWindow(to).to }
}

// Soma meses a um dia puro. 31/01 + 1 mês = 28/02, não 03/03.
export function addMonthsDateOnly(date: Date, months: number): Date {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + months
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay)))
}

// Atalhos pro caso mais comum: janela do dia (em Brasília) que contém um
// instante qualquer (por padrão, agora).
export function startOfDayBrazil(date: Date = new Date()): Date {
  return brazilDayWindow(brazilDateOnly(date)).from
}

export function endOfDayBrazil(date: Date = new Date()): Date {
  return brazilDayWindow(brazilDateOnly(date)).to
}
