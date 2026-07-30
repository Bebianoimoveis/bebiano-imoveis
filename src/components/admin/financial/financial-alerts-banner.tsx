import { AlertTriangle, CheckCircle2, TrendingDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/format"

type Alert = {
  icon: React.ReactNode
  message: string
  tone: "warning" | "destructive" | "success"
}

const TONE_STYLES: Record<Alert["tone"], string> = {
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  destructive: "border-destructive/30 bg-destructive/10 text-destructive",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
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
    })
  }

  if (monthBalance < 0) {
    alerts.push({
      icon: <TrendingDown className="size-4 shrink-0" />,
      message: `Fluxo de caixa negativo neste mês (${formatCurrency(monthBalance)}).`,
      tone: "warning",
    })
  }

  if (goalsHit > 0) {
    alerts.push({
      icon: <CheckCircle2 className="size-4 shrink-0" />,
      message: `${goalsHit} meta${goalsHit > 1 ? "s" : ""} atingida${goalsHit > 1 ? "s" : ""} este ano.`,
      tone: "success",
    })
  }

  if (alerts.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {alerts.map((alert, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium",
            TONE_STYLES[alert.tone]
          )}
        >
          {alert.icon}
          {alert.message}
        </div>
      ))}
    </div>
  )
}
