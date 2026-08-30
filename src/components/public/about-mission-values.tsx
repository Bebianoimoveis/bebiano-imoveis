import { Compass, Eye, Heart, Target } from "lucide-react"

import { Reveal } from "@/components/motion/reveal"
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group"
import { AccentWord } from "@/components/public/accent-word"

const CARDS = [
  {
    icon: Target,
    title: "Missão",
    text: "Transformar vidas por meio do mercado imobiliário, desenvolvendo corretores de imóveis de excelência, profissionais autônomos comprometidos em realizar sonhos, servindo com propósito cada pessoa que Deus colocar em seus caminhos.",
  },
  {
    icon: Eye,
    title: "Visão",
    text: "Ser a imobiliária de referência da região do Alto Tietê, reconhecida pela excelência, credibilidade, profissionalismo e, acima de tudo, pela confiança que construímos em cada relacionamento com nossos parceiros e clientes.",
  },
  {
    icon: Heart,
    title: "Valores",
    text: "Ser uma empresa que acredita, valoriza, reconhece e investe em pessoas, ajudando e somando no propósito individual de cada cliente e cada corretor, formando profissionais com fundamentos, valores e princípios bíblicos e cristãos.",
  },
  {
    icon: Compass,
    title: "Propósito",
    text: "Acreditamos em pessoas, investimos em talentos e fortalecemos propósitos. Ajudamos cada cliente e cada corretor a avançar em seu propósito, formando profissionais firmados em valores, princípios e fundamentos cristãos, para transformar vidas e glorificar a Deus em tudo o que fazemos.",
  },
]

export function AboutMissionValues() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <Reveal className="mb-10 text-center sm:mb-12">
        <p className="text-sm font-medium tracking-widest text-gold-dark uppercase">
          O que nos move
        </p>
        <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
          Missão, Visão, Valores e <AccentWord>Propósito</AccentWord>
        </h2>
      </Reveal>

      <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card) => (
          <StaggerItem
            key={card.title}
            className="group flex flex-col items-center gap-4 rounded-[20px] border border-border/60 bg-card p-8 text-center transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/30 hover:ring-1 hover:ring-gold/30"
          >
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/15 transition-transform duration-500 group-hover:scale-110">
              <card.icon className="size-6 text-gold" strokeWidth={1.5} />
            </div>
            <p className="font-heading text-xl font-semibold">{card.title}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{card.text}</p>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  )
}
