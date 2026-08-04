import {
  BadgeCheck,
  ClipboardCheck,
  FileCheck2,
  HandCoins,
  MapPin,
  MessagesSquare,
} from "lucide-react"

import { Reveal } from "@/components/motion/reveal"
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group"
import { AccentWord } from "@/components/public/accent-word"

const REASONS = [
  { icon: MapPin, title: "Especialistas locais", text: "Conhecimento profundo de cada região onde atuamos." },
  { icon: HandCoins, title: "Avaliação gratuita", text: "Descubra o valor real do seu imóvel, sem custo." },
  { icon: MessagesSquare, title: "Atendimento rápido", text: "Respostas ágeis, do primeiro contato à visita." },
  { icon: FileCheck2, title: "Documentação segura", text: "Conferência cuidadosa em cada etapa da negociação." },
  { icon: ClipboardCheck, title: "Negociação transparente", text: "Condições claras, sem surpresas no contrato." },
  { icon: BadgeCheck, title: "Suporte completo", text: "Acompanhamento até depois da entrega das chaves." },
]

export function AboutWhyChoose() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <Reveal className="mb-10 text-center sm:mb-12">
        <p className="text-sm font-medium tracking-widest text-gold-dark uppercase">
          Sua confiança, nossa responsabilidade
        </p>
        <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
          Por que escolher a <AccentWord>Bebiano</AccentWord>
        </h2>
      </Reveal>

      <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {REASONS.map((reason) => (
          <StaggerItem
            key={reason.title}
            className="flex items-start gap-4 rounded-[20px] border border-border/60 bg-card p-6 transition-all duration-500 hover:-translate-y-1 hover:ring-1 hover:ring-gold/30"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <reason.icon className="size-5 text-gold" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-medium text-foreground">{reason.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{reason.text}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  )
}
