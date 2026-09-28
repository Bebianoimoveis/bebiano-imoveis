"use client"

import { useState, useTransition } from "react"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { generateBusinessInsights } from "@/modules/report/actions"

// Cada bloco da resposta vem separado por linha em branco e começa com
// "TÍTULO:" (instrução de sistema em report/actions.ts) — parseado aqui
// só pra dar um título em destaque a cada bloco, sem exigir nenhum
// markdown da IA (a interface do painel não interpreta markdown).
function parseBlocks(text: string) {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const match = block.match(/^([A-ZÀ-Ú][A-ZÀ-Ú\s]{2,40}):\s*([\s\S]*)$/)
      if (!match) return { title: null, body: block }
      return { title: match[1].trim(), body: match[2].trim() }
    })
}

export function BusinessInsightsPanel() {
  const [isPending, startTransition] = useTransition()
  const [text, setText] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null)

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateBusinessInsights()
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      setText(result.text)
      setGeneratedAt(new Date())
    })
  }

  const blocks = text ? parseBlocks(text) : []

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
              Previsão, comparativos e sugestões geradas a partir dos dados reais do negócio.
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
              Gerado às{" "}
              {generatedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} — os números podem
              mudar em gerações futuras conforme o negócio avança.
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
          Clique em &ldquo;Gerar análise&rdquo; pra ter uma leitura completa do negócio: visão geral, faturamento
          mensal, previsão de fechamento do mês e, se você tiver acesso, comparativo entre corretores.
        </p>
      ) : null}
    </div>
  )
}
