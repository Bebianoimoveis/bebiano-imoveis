"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Send } from "lucide-react"

import { Sheet } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { askAssistant } from "@/modules/assistant/actions"
import { cn } from "@/lib/utils"

type Message = { role: "user" | "model"; content: string }

function greetingForHour(hour: number) {
  if (hour < 12) return "Bom dia"
  if (hour < 18) return "Boa tarde"
  return "Boa noite"
}

// Heurística simples sobre a pergunta (não sobre qual ferramenta foi
// chamada — isso só se sabe depois da resposta) só pra dar um feedback
// mais específico que "Pensando...", nunca expondo nome de ferramenta.
function loadingLabelFor(question: string) {
  const q = question.toLowerCase()
  if (/resum|briefing|meu dia|me atualiz/.test(q)) return "Montando seu resumo..."
  if (/lead/.test(q)) return "Consultando seus leads..."
  if (/financ|receita|despesa|comiss|faturament/.test(q)) return "Consultando o financeiro..."
  if (/agenda|visita|compromisso/.test(q)) return "Consultando sua agenda..."
  if (/proposta/.test(q)) return "Consultando propostas..."
  if (/cliente/.test(q)) return "Consultando clientes..."
  if (/im[oó]ve/.test(q)) return "Consultando imóveis..."
  return "Consultando o sistema..."
}

function buildSuggestions(permissions: Set<string>) {
  const suggestions = ["Resumir meu dia", "Leads que precisam de atenção", "Próximas visitas"]
  if (permissions.has("financial.view")) suggestions.push("Como está o financeiro?")
  else suggestions.push("Analisar propostas")
  return suggestions
}

export function AssistantPanel({
  open,
  onOpenChange,
  firstName,
  permissionKeys,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  firstName: string
  permissionKeys: string[]
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null)
  const [now, setNow] = useState<Date | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) setNow(new Date())
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, loadingLabel])

  const permissions = new Set(permissionKeys)
  const suggestions = buildSuggestions(permissions)

  async function handleSend(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loadingLabel) return

    const nextMessages: Message[] = [...messages, { role: "user", content: trimmed }]
    setMessages(nextMessages)
    setInput("")
    setLoadingLabel(loadingLabelFor(trimmed))
    try {
      const reply = await askAssistant({ messages: nextMessages })
      setMessages((prev) => [...prev, reply])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "model", content: "Ocorreu um erro ao falar com a IA. Tente novamente." },
      ])
    } finally {
      setLoadingLabel(null)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right" className="w-full max-w-md">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-border/60 p-4">
          <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary">
            <Image src="/images/logo.png" alt="" fill className="object-cover object-top" sizes="36px" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-sm font-semibold text-foreground">Bebiano IA</p>
            <p className="truncate text-xs text-muted-foreground">Copiloto imobiliário</p>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => onOpenChange(false)}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col gap-4 py-6">
              <div>
                <p className="font-heading text-lg font-semibold text-foreground">
                  {now ? greetingForHour(now.getHours()) : "Olá"}, {firstName}.
                </p>
                <p className="text-sm text-muted-foreground">Como posso ajudar?</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSend(suggestion)}
                    className="rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap",
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))
          )}
          {loadingLabel ? (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-secondary px-3.5 py-2 text-sm text-muted-foreground">
                <span className="flex gap-0.5">
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
                </span>
                {loadingLabel}
              </div>
            </div>
          ) : null}
        </div>

        {messages.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 border-t border-border/60 px-3 pt-3">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSend(suggestion)}
                className="rounded-full border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend(input)
          }}
          className="flex items-center gap-2 p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte alguma coisa..."
            disabled={Boolean(loadingLabel)}
            className="flex-1 rounded-xl border border-border/60 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary/50"
          />
          <Button type="submit" size="icon" aria-label="Enviar" disabled={Boolean(loadingLabel) || !input.trim()}>
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </Sheet>
  )
}
