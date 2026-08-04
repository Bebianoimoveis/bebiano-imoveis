import { Cpu, HeartHandshake, MapPinned, ShieldCheck } from "lucide-react"

import { Reveal } from "@/components/motion/reveal"
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group"
import { AccentWord } from "@/components/public/accent-word"

const DIFERENCIAIS = [
  {
    icon: HeartHandshake,
    title: "Atendimento Humanizado",
    text: "Ouvimos antes de indicar. Cada conversa é o ponto de partida para entender sua real necessidade.",
  },
  {
    icon: MapPinned,
    title: "Especialistas da Região",
    text: "Conhecemos cada bairro de Mogi das Cruzes — os preços justos, os detalhes que fazem diferença.",
  },
  {
    icon: ShieldCheck,
    title: "Transparência",
    text: "Informações claras sobre preço, documentação e condições, sem letras miúdas.",
  },
  {
    icon: Cpu,
    title: "Tecnologia",
    text: "Ferramentas modernas para buscar, comparar e acompanhar seu imóvel do início ao fim.",
  },
]

export function AboutDifferentiators() {
  return (
    <section className="border-t border-border/60 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal className="mb-10 sm:mb-12">
          <p className="text-sm font-medium tracking-widest text-gold-dark uppercase">
            O que nos diferencia
          </p>
          <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
            Nosso <AccentWord>Diferencial</AccentWord>
          </h2>
        </Reveal>

        <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {DIFERENCIAIS.map((item) => (
            <StaggerItem
              key={item.title}
              className="space-y-3 rounded-[20px] border border-border/60 bg-card p-6 transition-all duration-500 hover:-translate-y-1 hover:ring-1 hover:ring-gold/30"
            >
              <div className="flex size-11 items-center justify-center rounded-full bg-primary/15">
                <item.icon className="size-5 text-gold" strokeWidth={1.5} />
              </div>
              <p className="font-medium text-foreground">{item.title}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  )
}
