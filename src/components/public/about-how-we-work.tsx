import { CalendarCheck, Handshake, KeyRound, Search, SearchCheck } from "lucide-react"

import { Reveal } from "@/components/motion/reveal"
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group"
import { AccentWord } from "@/components/public/accent-word"

const STEPS = [
  {
    icon: Search,
    title: "Entendemos sua necessidade",
    text: "Conversamos para entender o que você busca: perfil, região, orçamento e prazo.",
  },
  {
    icon: SearchCheck,
    title: "Selecionamos os melhores imóveis",
    text: "Filtramos o catálogo para trazer só opções que fazem sentido para você.",
  },
  {
    icon: CalendarCheck,
    title: "Agendamos visitas",
    text: "Organizamos visitas no seu ritmo, com um corretor dedicado acompanhando cada uma.",
  },
  {
    icon: Handshake,
    title: "Negociamos",
    text: "Conduzimos a negociação com transparência, sempre defendendo seu melhor interesse.",
  },
  {
    icon: KeyRound,
    title: "Concluímos sua conquista",
    text: "Cuidamos da documentação até a entrega das chaves — o fechamento de uma nova fase.",
  },
]

export function AboutHowWeWork() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <Reveal className="mb-10 text-center sm:mb-14">
        <p className="text-sm font-medium tracking-widest text-gold-dark uppercase">
          Do primeiro contato às chaves na mão
        </p>
        <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
          Como <AccentWord>trabalhamos</AccentWord>
        </h2>
      </Reveal>

      <StaggerGroup className="relative grid gap-8 sm:grid-cols-5 sm:gap-4">
        {/* Linha conectora — só no desktop, atrás dos círculos numerados */}
        <div className="pointer-events-none absolute top-7 right-0 left-0 hidden h-px bg-border sm:block" />

        {STEPS.map((step, index) => (
          <StaggerItem key={step.title} className="relative flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
            <div className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full bg-card ring-1 ring-gold/40">
              <step.icon className="size-6 text-gold" strokeWidth={1.5} />
            </div>
            <p className="text-xs font-medium tracking-widest text-gold-dark uppercase">
              Passo {index + 1}
            </p>
            <p className="font-heading text-base font-semibold">{step.title}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{step.text}</p>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  )
}
