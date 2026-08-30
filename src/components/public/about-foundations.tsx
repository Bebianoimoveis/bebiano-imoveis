import { Flag, Quote, Sun, Users } from "lucide-react"

import { Reveal } from "@/components/motion/reveal"
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group"
import { AccentWord } from "@/components/public/accent-word"

const PRIORIDADES = [
  { order: "1º lugar", label: "Deus" },
  { order: "2º lugar", label: "Família" },
  { order: "3º lugar", label: "Trabalho" },
]

const PROPOSITO = [
  {
    icon: Flag,
    title: "Obedecer o Chamado",
    text: "Empreendendo para iluminar, cumprindo o “Ide” de Jesus, guiando e ajudando pessoas através de um trabalho honesto, confiável, leve e profissional.",
  },
  {
    icon: Sun,
    title: "Sendo Luz",
    text: "Iluminando o mercado imobiliário, sendo a diferença, trabalhando com verdade e transparência, para que todos ao nosso redor glorifiquem a Deus através do nosso trabalho.",
  },
  {
    icon: Users,
    title: "Influenciando a Todos",
    text: "Agindo como Jesus agiria, valorizando, reconhecendo e alcançando pessoas que precisam de ajuda, abençoando e guiando o caminho delas até Ele.",
  },
]

// Conteúdo institucional/de fé passado pela cliente (versículo-base,
// regra de vida, "placa invisível", prioridades, propósito) — tudo
// literal, sem parafrasear o sentido, só ajustado pro tom de texto de
// site (maiúsculas/pontuação do material original).
export function AboutFoundations() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <Reveal className="mb-10 text-center sm:mb-12">
        <p className="text-sm font-medium tracking-widest text-gold-dark uppercase">
          Nascemos através de uma palavra
        </p>
        <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
          E seremos sempre <AccentWord>guiados</AccentWord> por ela!
        </h2>
      </Reveal>

      <Reveal className="mx-auto mb-10 max-w-3xl rounded-[20px] border border-border/60 bg-card p-6 text-center sm:p-8">
        <Quote className="mx-auto mb-3 size-6 text-gold" strokeWidth={1.5} />
        <p className="font-heading text-sm font-semibold text-gold-dark">Mateus 5:14-16</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground italic sm:text-base">
          &ldquo;Vocês são a luz do mundo. Não se pode esconder uma cidade construída sobre um
          monte. Ninguém acende uma lamparina para colocá-la debaixo de um cesto. Pelo contrário,
          ela é colocada no lugar próprio para que ilumine todos os que estão na casa. Assim
          também a luz de vocês deve brilhar para que os outros vejam as coisas boas que vocês
          fazem e louvem o Pai de vocês, que está no céu.&rdquo;
        </p>
      </Reveal>

      <div className="mb-12 grid gap-5 sm:grid-cols-2">
        <Reveal className="rounded-[20px] border border-border/60 bg-card p-6">
          <p className="font-heading font-semibold">
            Temos uma Regra de <AccentWord>Vida</AccentWord>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground italic">
            &ldquo;Façam aos outros o que querem que eles façam a vocês, e não façam aos outros o
            que não querem que eles façam a vocês.&rdquo;
          </p>
          <p className="mt-2 text-xs font-medium text-gold-dark">Mateus 7:12</p>
        </Reveal>
        <Reveal delay={0.1} className="rounded-[20px] border border-border/60 bg-card p-6">
          <p className="font-heading font-semibold">
            A Placa <AccentWord>Invisível</AccentWord>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground italic">
            &ldquo;Imagine uma placa invisível ao redor do pescoço de cada pessoa dizendo:
            'Faça-me sentir importante!'&rdquo;
          </p>
          <p className="mt-2 text-xs font-medium text-gold-dark">Mary Kay Ash</p>
        </Reveal>
      </div>

      <Reveal className="mx-auto mb-14 max-w-sm text-center">
        <p className="font-heading font-semibold">Seguimos uma Lista de Prioridades</p>
        <div className="mt-4 space-y-2.5">
          {PRIORIDADES.map((item) => (
            <div key={item.label} className="flex items-center justify-center gap-3">
              <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold-dark">
                {item.order}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal className="mb-8 text-center">
        <p className="font-heading font-semibold">
          Qual o nosso <AccentWord>Propósito</AccentWord>?
        </p>
      </Reveal>

      <StaggerGroup className="grid gap-6 sm:grid-cols-3">
        {PROPOSITO.map((item) => (
          <StaggerItem
            key={item.title}
            className="space-y-3 rounded-[20px] border border-border/60 bg-card p-6 text-center transition-all duration-500 hover:-translate-y-1 hover:ring-1 hover:ring-gold/30"
          >
            <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-primary/15">
              <item.icon className="size-5 text-gold" strokeWidth={1.5} />
            </div>
            <p className="font-medium text-foreground">{item.title}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  )
}
