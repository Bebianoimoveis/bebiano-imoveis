import { CheckCircle2, Sparkles, TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"

// Mensagem computada por regra simples a partir dos números já
// carregados no Dashboard — não é um resumo gerado por IA (por isso o
// selo diz "Resumo", não "IA"), mas cumpre o mesmo papel visual de dar
// uma leitura rápida do estado geral antes dos cards.
export function DashboardInsightBanner({
  alertsCount,
  activityGrowthPercent,
}: {
  alertsCount: number
  activityGrowthPercent: number | null
}) {
  let message: string
  let tone: "positive" | "warning" | "neutral"
  let Icon = Sparkles

  if (alertsCount > 0) {
    message = `${alertsCount} ${alertsCount > 1 ? "pontos precisam" : "ponto precisa"} de atenção — veja os Alertas ao lado.`
    tone = "warning"
    Icon = TriangleAlert
  } else if (activityGrowthPercent !== null && activityGrowthPercent > 0) {
    message = `Captação de leads ${activityGrowthPercent}% acima do período anterior. Continue assim!`
    tone = "positive"
    Icon = CheckCircle2
  } else {
    message = "Indicadores dentro do esperado. Continue monitorando!"
    tone = "positive"
    Icon = CheckCircle2
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3">
      <span
        className={cn(
          "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
          tone === "warning" ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"
        )}
      >
        <Icon className="size-3" /> Resumo
      </span>
      <p className="text-sm text-foreground">{message}</p>
    </div>
  )
}
