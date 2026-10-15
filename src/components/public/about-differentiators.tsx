import { Cpu, HeartHandshake, MapPinned, ShieldCheck } from "lucide-react"

import { Reveal } from "@/components/motion/reveal"
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group"
import { AccentWord } from "@/components/public/accent-word"
import { MOBILE_CAROUSEL, MOBILE_CAROUSEL_ITEM } from "@/components/public/mobile-carousel"
import { cn } from "@/lib/utils"
import { SectionBackdrop } from "@/components/public/section-backdrop"

const DIFFERENTIATOR_ICONS = [HeartHandshake, MapPinned, ShieldCheck, Cpu]

// Só título/texto são editáveis em Configurações — ícone e ordem ficam
// fixos no código.
export const DEFAULT_DIFFERENTIATORS = [
  {
    title: "Atendimento Humanizado",
    text: "Ouvimos antes de indicar. Cada conversa é o ponto de partida para entender sua real necessidade.",
  },
  {
    title: "Especialistas da Região",
    text: "Conhecemos cada bairro de Mogi das Cruzes — os preços justos, os detalhes que fazem diferença.",
  },
  {
    title: "Transparência",
    text: "Informações claras sobre preço, documentação e condições, sem letras miúdas.",
  },
  {
    title: "Tecnologia",
    text: "Ferramentas modernas para buscar, comparar e acompanhar seu imóvel do início ao fim.",
  },
]

export type AboutDifferentiatorItem = { title: string; text: string }

export function AboutDifferentiators({
  items = DEFAULT_DIFFERENTIATORS,
}: {
  items?: AboutDifferentiatorItem[]
}) {
  const DIFERENCIAIS = items.map((item, index) => ({
    ...item,
    icon: DIFFERENTIATOR_ICONS[index] ?? DIFFERENTIATOR_ICONS[0],
  }))

  return (
    <SectionBackdrop
      imageUrl="/images/about/differentiators.jpg"
      className="border-t border-border/60"
      mobilePositionClassName="object-[65%_50%] sm:object-center"
    >
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-20">
        <Reveal className="mb-6 sm:mb-12">
          <p className="text-sm font-medium tracking-widest text-gold-dark uppercase">
            O que nos diferencia
          </p>
          <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
            Nosso <AccentWord>Diferencial</AccentWord>
          </h2>
        </Reveal>

        <StaggerGroup className={cn(MOBILE_CAROUSEL, "sm:grid-cols-2 lg:grid-cols-4")}>
          {DIFERENCIAIS.map((item) => (
            <StaggerItem
              key={item.title}
            className={cn(MOBILE_CAROUSEL_ITEM, "space-y-3 rounded-[20px] border border-white/10 bg-card/80 p-6 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:ring-1 hover:ring-gold/30")}
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
    </SectionBackdrop>
  )
}
