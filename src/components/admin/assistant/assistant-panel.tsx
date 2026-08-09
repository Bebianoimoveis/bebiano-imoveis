"use client"

import { useEffect, useRef, useState } from "react"
import { Send, Sparkles } from "lucide-react"

import { Sheet } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { askAssistant } from "@/modules/assistant/actions"
import { cn } from "@/lib/utils"

type Message = { role: "user" | "model"; content: string }

const SUGGESTIONS = [
  "Como estão os leads este mês?",
  "Qual o resumo do financeiro?",
  "Quantos imóveis estão publicados?",
]

export function AssistantPanel({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isPending, setIsPending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, isPending])

  async function handleSend(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isPending) return

    const nextMessages: Message[] = [...messages, { role: "user", content: trimmed }]
    setMessages(nextMessages)
    setInput("")
    setIsPending(true)
    try {
      const reply = await askAssistant({ messages: nextMessages })
      setMessages((prev) => [...prev, reply])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "model", content: "Ocorreu um erro ao falar com a IA. Tente novamente." },
      ])
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right" title="Assistente IA" className="w-full max-w-md">
      <div className="flex h-full flex-col">
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Sparkles className="size-5" />
              </span>
              <p className="text-sm text-muted-foreground">
                Pergunte sobre leads, clientes, imóveis, propostas, financeiro ou agenda.
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {SUGGESTIONS.map((suggestion) => (
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
          {isPending ? (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-secondary px-3.5 py-2 text-sm text-muted-foreground">Pensando...</div>
            </div>
          ) : null}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend(input)
          }}
          className="flex items-center gap-2 border-t border-border/60 p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte alguma coisa..."
            disabled={isPending}
            className="flex-1 rounded-xl border border-border/60 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary/50"
          />
          <Button type="submit" size="icon" aria-label="Enviar" disabled={isPending || !input.trim()}>
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </Sheet>
  )
}
