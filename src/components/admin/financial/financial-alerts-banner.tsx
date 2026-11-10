import Link from "next/link"
import { AlertTriangle, ArrowRight, CheckCircle2, TrendingDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/format"
import { brazilDateOnly } from "@/lib/date"

type Alert = {
  icon: React.ReactNode
  message: string
  tone: "warning" | "destructive" | "success"
  // Pra onde o aviso leva: direto no que está sendo avisado.
  href: string
}

const TONE_STYLES: Record<Alert["tone"], string> = {
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  destructive: "border-destructive/30 bg-destructive/10 text-destructive",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
}

// Primeiro e último dia do mês atual (Brasília), como "YYYY-MM-DD" — o
// vencimento é guardado como dia puro (meia-noite UTC), então bate certo
// com o filtro de período de Lançamentos.
function currentMonthRange() {
  const today = brazilDateOnly()
  const year = today.getUTCFullYear()
  const month = today.getUTCMonth()
  const iso = (date: Date) => date.toISOString().slice(0, 10)
  return {
    from: iso(new Date(Date.UTC(year, month, 1))),
    to: iso(new Date(Date.UTC(year, month + 1, 0))),
  }
}

// Alertas computados ao vivo a partir dos dados já carregados na página —
// não são notificações assíncronas reais (sem cron no projeto, ver plano).
export function FinancialAlertsBanner({
  overdueCount,
  monthBalance,
  goalsHit,
}: {
  overdueCount: number
  monthBalance: number
  goalsHit: number
}) {
  const alerts: Alert[] = []

  if (overdueCount > 0) {
    alerts.push({
      icon: <AlertTriangle className="size-4 shrink-0" />,
      message: `${overdueCount} lançamento${overdueCount > 1 ? "s" : ""} em atraso.`,
      tone: "destructive",
      href: "/admin/financeiro?tab=lancamentos&overdue=1",
    })
  }

  if (monthBalance < 0) {
    alerts.push({
      icon: <TrendingDown className="size-4 shrink-0" />,
      message: `Fluxo de caixa negativo neste mês (${formatCurrency(monthBalance)}).`,
      tone: "warning",
      href: `/admin/financeiro?tab=lancamentos&from=${currentMonthRange().from}&to=${currentMonthRange().to}`,
    })
  }

  if (goalsHit > 0) {
    alerts.push({
      icon: <CheckCircle2 className="size-4 shrink-0" />,
      message: `${goalsHit} meta${goalsHit > 1 ? "s" : ""} atingida${goalsHit > 1 ? "s" : ""} este ano.`,
      tone: "success",
      href: "/admin/metas",
    })
  }

  if (alerts.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {alerts.map((alert, index) => (
        <Link
          key={index}
          href={alert.href}
          className={cn(
            "group flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-[filter] hover:brightness-110",
            TONE_STYLES[alert.tone]
          )}
        >
          {alert.icon}
          {alert.message}
          <ArrowRight className="ml-auto size-4 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
        </Link>
      ))}
    </div>
  )
}
