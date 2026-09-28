"use client"

import { useState, useTransition } from "react"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { generateFinancialInsights } from "@/modules/financial/actions"
import { parseAiReportBlocks } from "@/lib/parse-ai-report-blocks"

// `initialText`/`initialGeneratedAt` vêm do cache salvo no banco
// (FinancialInsight) — a última análise aparece na hora, sem gastar
// nenhum token; só "Gerar de novo" chama a IA de verdade. Evita
// reprocessar (e regastar tokens) toda vez que alguém só quer ver o
// que já foi levantado antes.
export function FinancialInsightsPanel({
  initialText,
  initialGeneratedAt,
}: {
  initialText: string | null
  initialGeneratedAt: Date | null
}) {
  const [isPending, startTransition] = useTransition()
  const [text, setText] = useState<string | null>(initialText)
  const [generatedAt, setGeneratedAt] = useState<Date | null>(initialGeneratedAt)

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateFinancialInsights()
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      setText(result.text)
      setGeneratedAt(new Date(result.generatedAt))
    })
  }

  const blocks = text ? parseAiReportBlocks(text) : []

  return (
    <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="size-4" />
          </span>
          <div>
            <h2 className="font-heading text-base font-semibold">Análise com IA</h2>
            <p className="text-sm text-muted-foreground">
              Comparativo mês a mês, tendência, previsão e sugestões a partir dos dados financeiros reais.
            </p>
          </div>
        </div>
        <Button size="sm" onClick={handleGenerate} disabled={isPending} className="gap-1.5">
          <Sparkles className="size-3.5" />
          {isPending ? "Gerando..." : text ? "Gerar de novo" : "Gerar análise"}
        </Button>
      </div>

      {text ? (
        <div className="space-y-4 border-t border-border/60 pt-4">
          {generatedAt ? (
            <p className="text-xs text-muted-foreground">
              Gerado em {generatedAt.toLocaleDateString("pt-BR")} às{" "}
              {generatedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} — clique em
              &ldquo;Gerar de novo&rdquo; pra atualizar com os lançamentos mais recentes.
            </p>
          ) : null}
          {blocks.map((block, index) => (
            <div key={index} className="space-y-1">
              {block.title ? (
                <p className="text-xs font-semibold tracking-wide text-primary uppercase">{block.title}</p>
              ) : null}
              <p className="whitespace-pre-wrap text-sm text-foreground">{block.body}</p>
            </div>
          ))}
        </div>
      ) : !isPending ? (
        <p className="border-t border-border/60 pt-4 text-sm text-muted-foreground">
          Clique em &ldquo;Gerar análise&rdquo; pra ter uma leitura completa do financeiro: comparativo com o
          mês passado, tendência dos últimos meses, previsão de fechamento, comissões por corretor e
          sugestões.
        </p>
      ) : null}
    </div>
  )
}
