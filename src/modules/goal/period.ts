// Regras de período das metas — puras (sem banco), usadas tanto no
// servidor (salvar/calcular) quanto na tela (rótulos, prévia do período).
// Datas "só dia": meia-noite UTC, início e fim inclusivos.

export type GoalPeriodType = "MONTH" | "QUARTER" | "YEAR" | "YEAR_TO_MONTH" | "MONTHLY" | "CUSTOM"
export type GoalMetricType = "REVENUE" | "SALES_VALUE" | "SALES_COUNT"
export type GoalScopeType = "COMPANY" | "REALTOR" | "CITY"

const DAY_MS = 24 * 60 * 60 * 1000

export const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

export const MONTH_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export const PERIOD_LABELS: Record<GoalPeriodType, string> = {
  MONTH: "Um mês",
  MONTHLY: "Todo mês",
  QUARTER: "Trimestre",
  YEAR_TO_MONTH: "Acumulado até um mês",
  YEAR: "Ano inteiro",
  CUSTOM: "Período livre",
}

export const METRIC_LABELS: Record<GoalMetricType, string> = {
  SALES_VALUE: "Valor vendido",
  REVENUE: "Faturamento recebido",
  SALES_COUNT: "Quantidade de vendas",
}

export const METRIC_HINTS: Record<GoalMetricType, string> = {
  SALES_VALUE: "Soma do valor dos contratos fechados (ativos ou concluídos) no período.",
  REVENUE: "Soma das receitas marcadas como recebidas na Gestão Financeira no período.",
  SALES_COUNT: "Quantos contratos foram fechados (ativos ou concluídos) no período.",
}

export function dateOnly(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day))
}

function lastDayOfMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0))
}

export type GoalPeriodInput = {
  period: GoalPeriodType
  year: number
  month?: number // 1-12 (MONTH, YEAR_TO_MONTH, início do MONTHLY)
  endMonth?: number // 1-12 (fim do MONTHLY)
  quarter?: number // 1-4
  startDate?: Date // CUSTOM
  endDate?: Date // CUSTOM
}

export function resolveGoalPeriod(input: GoalPeriodInput): { startDate: Date; endDate: Date } {
  const { year } = input
  switch (input.period) {
    case "MONTH": {
      const m = (input.month ?? 1) - 1
      return { startDate: dateOnly(year, m, 1), endDate: lastDayOfMonth(year, m) }
    }
    case "QUARTER": {
      const q = (input.quarter ?? 1) - 1
      return { startDate: dateOnly(year, q * 3, 1), endDate: lastDayOfMonth(year, q * 3 + 2) }
    }
    case "YEAR_TO_MONTH": {
      const m = (input.month ?? 12) - 1
      return { startDate: dateOnly(year, 0, 1), endDate: lastDayOfMonth(year, m) }
    }
    case "MONTHLY": {
      const start = (input.month ?? 1) - 1
      const end = (input.endMonth ?? 12) - 1
      return { startDate: dateOnly(year, start, 1), endDate: lastDayOfMonth(year, end) }
    }
    case "CUSTOM":
      return { startDate: input.startDate!, endDate: input.endDate! }
    case "YEAR":
    default:
      return { startDate: dateOnly(year, 0, 1), endDate: dateOnly(year, 11, 31) }
  }
}

function fmtDay(date: Date) {
  return date.toLocaleDateString("pt-BR", { timeZone: "UTC" })
}

export function periodLabel(goal: { period: GoalPeriodType; startDate: Date; endDate: Date }) {
  const s = goal.startDate
  const e = goal.endDate
  const sy = s.getUTCFullYear()
  switch (goal.period) {
    case "MONTH":
      return `${MONTH_NAMES[s.getUTCMonth()]} de ${sy}`
    case "QUARTER":
      return `${Math.floor(s.getUTCMonth() / 3) + 1}º trimestre de ${sy}`
    case "YEAR":
      return `Ano de ${sy}`
    case "YEAR_TO_MONTH":
      return `Janeiro até ${MONTH_NAMES[e.getUTCMonth()].toLowerCase()} de ${sy}`
    case "MONTHLY":
      return s.getUTCMonth() === 0 && e.getUTCMonth() === 11
        ? `Todo mês de ${sy}`
        : `Todo mês, de ${MONTH_NAMES[s.getUTCMonth()].toLowerCase()} a ${MONTH_NAMES[e.getUTCMonth()].toLowerCase()} de ${sy}`
    case "CUSTOM":
    default:
      return `${fmtDay(s)} a ${fmtDay(e)}`
  }
}

// Quantos dias (inclusivos) entre dois dias.
export function daysBetween(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1
}

// Meses (identidade do 1º dia) cobertos por uma meta MONTHLY.
export function monthsInRange(start: Date, end: Date) {
  const months: { start: Date; end: Date }[] = []
  let y = start.getUTCFullYear()
  let m = start.getUTCMonth()
  while (y < end.getUTCFullYear() || (y === end.getUTCFullYear() && m <= end.getUTCMonth())) {
    months.push({ start: dateOnly(y, m, 1), end: lastDayOfMonth(y, m) })
    m += 1
    if (m > 11) {
      m = 0
      y += 1
    }
  }
  return months
}

export type GoalStatus = "HIT" | "ON_TRACK" | "ATTENTION" | "BEHIND" | "MISSED" | "UPCOMING"

export const STATUS_LABELS: Record<GoalStatus, string> = {
  HIT: "Meta batida",
  ON_TRACK: "No ritmo",
  ATTENTION: "Atenção",
  BEHIND: "Abaixo do ritmo",
  MISSED: "Não batida",
  UPCOMING: "Ainda não começou",
}

export type GoalProgress = {
  realized: number
  target: number
  percent: number // realizado / meta (sem teto)
  expectedPercent: number // onde deveria estar hoje pelo calendário
  expectedNow: number // valor esperado até hoje
  projection: number | null // ritmo atual projetado pro fim do período
  remaining: number
  daysTotal: number
  daysElapsed: number
  daysLeft: number
  perDayNeeded: number | null
  status: GoalStatus
}

// "No ritmo" = realizado acompanha a fração do período já passada.
// Tolerância: até 90% do esperado ainda é "no ritmo"; de 70% a 90% é
// "atenção"; abaixo disso, "abaixo do ritmo".
export function computeProgress(
  realized: number,
  target: number,
  start: Date,
  end: Date,
  today: Date
): GoalProgress {
  const daysTotal = daysBetween(start, end)
  let daysElapsed: number
  if (today < start) daysElapsed = 0
  else if (today > end) daysElapsed = daysTotal
  else daysElapsed = daysBetween(start, today)
  const daysLeft = daysTotal - daysElapsed

  const fraction = daysTotal > 0 ? daysElapsed / daysTotal : 1
  const expectedNow = target * fraction
  const percent = target > 0 ? (realized / target) * 100 : 0
  const remaining = Math.max(0, target - realized)
  const projection = daysElapsed > 0 ? realized / fraction : null

  let status: GoalStatus
  if (realized >= target && target > 0) status = "HIT"
  else if (today < start) status = "UPCOMING"
  else if (today > end) status = "MISSED"
  else if (realized >= expectedNow * 0.9) status = "ON_TRACK"
  else if (realized >= expectedNow * 0.7) status = "ATTENTION"
  else status = "BEHIND"

  return {
    realized,
    target,
    percent,
    expectedPercent: fraction * 100,
    expectedNow,
    projection,
    remaining,
    daysTotal,
    daysElapsed,
    daysLeft,
    perDayNeeded: daysLeft > 0 && remaining > 0 ? remaining / daysLeft : null,
    status,
  }
}
