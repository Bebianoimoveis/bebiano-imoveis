import { Flag, Quote, Sun, Users } from "lucide-react"

import { Reveal } from "@/components/motion/reveal"
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group"
import { AccentWord } from "@/components/public/accent-word"
import { SectionBackdrop } from "@/components/public/section-backdrop"
import { cn } from "@/lib/utils"
import { MOBILE_CAROUSEL, MOBILE_CAROUSEL_ITEM } from "@/components/public/mobile-carousel"

const PURPOSE_ICONS = [Flag, Sun, Users]

// Lamparina acesa atrás do versículo ("vocês são a luz do mundo... uma
// lamparina"); família de mãos dadas atrás da regra de vida e das
// prioridades (Deus, Família, Trabalho).
const VERSE_BACKGROUND = "/images/about/foundations-verse.jpg"
const LIFE_BACKGROUND = "/images/about/foundations-life.jpg"

// Mesmo tamanho dos títulos de seção do resto da página, a pedido da
// cliente — antes os subtítulos (Regra de Vida, Placa Invisível,
// Prioridades, Propósito) eram bem menores e alinhados à esquerda.
const TITLE_CLASS = "font-heading text-3xl font-semibold tracking-tight text-balance"
const CARD_CLASS = "rounded-[20px] border border-white/10 bg-card/75 backdrop-blur-sm"

// Conteúdo institucional/de fé passado pela cliente (versículo-base,
// regra de vida, "placa invisível", prioridades, propósito) — tudo
// literal, sem parafrasear o sentido, só ajustado pro tom de texto de
// site (maiúsculas/pontuação do material original). Editável inteiro em
// Configurações — os ícones dos 3 cards de propósito ficam fixos
// (PURPOSE_ICONS acima), o resto é texto livre.
export const DEFAULT_FOUNDATIONS = {
  verseRef: "Mateus 5:14-16",
  verseText:
    "“Vocês são a luz do mundo. Não se pode esconder uma cidade construída sobre um monte. Ninguém acende uma lamparina para colocá-la debaixo de um cesto. Pelo contrário, ela é colocada no lugar próprio para que ilumine todos os que estão na casa. Assim também a luz de vocês deve brilhar para que os outros vejam as coisas boas que vocês fazem e louvem o Pai de vocês, que está no céu.”",
  ruleText:
    "“Façam aos outros o que querem que eles façam a vocês, e não façam aos outros o que não querem que eles façam a vocês.”",
  ruleRef: "Mateus 7:12",
  badgeText:
    "“Imagine uma placa invisível ao redor do pescoço de cada pessoa dizendo: 'Faça-me sentir importante!'”",
  badgeAuthor: "Mary Kay Ash",
  priorities: ["Deus", "Família", "Trabalho"],
  purpose: [
    {
      title: "Obedecer o Chamado",
      text: "Empreendendo para iluminar, cumprindo o “Ide” de Jesus, guiando e ajudando pessoas através de um trabalho honesto, confiável, leve e profissional.",
    },
    {
      title: "Sendo Luz",
      text: "Iluminando o mercado imobiliário, sendo a diferença, trabalhando com verdade e transparência, para que todos ao nosso redor glorifiquem a Deus através do nosso trabalho.",
    },
    {
      title: "Influenciando a Todos",
      text: "Agindo como Jesus agiria, valorizando, reconhecendo e alcançando pessoas que precisam de ajuda, abençoando e guiando o caminho delas até Ele.",
    },
  ],
}

export type AboutFoundationsContent = typeof DEFAULT_FOUNDATIONS

export function AboutFoundations({
  content = DEFAULT_FOUNDATIONS,
}: {
  content?: AboutFoundationsContent
}) {
  const PRIORIDADES = content.priorities.map((label, index) => ({
    order: `${index + 1}º lugar`,
    label,
  }))
  const PROPOSITO = content.purpose.map((item, index) => ({
    ...item,
    icon: PURPOSE_ICONS[index] ?? PURPOSE_ICONS[0],
  }))

  return (
    <>
      <SectionBackdrop imageUrl={VERSE_BACKGROUND}>
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-20">
          <Reveal className="mb-6 text-center sm:mb-12">
            <p className="text-sm font-medium tracking-widest text-gold-dark uppercase">
              Nascemos através de uma palavra
            </p>
            <h2 className={cn(TITLE_CLASS, "mt-2")}>
              E seremos sempre <AccentWord>guiados</AccentWord> por ela!
            </h2>
          </Reveal>

          <Reveal className={cn(CARD_CLASS, "mx-auto max-w-3xl p-6 text-center sm:p-8")}>
            <Quote className="mx-auto mb-3 size-6 text-gold" strokeWidth={1.5} />
            <p className="font-heading text-sm font-semibold text-gold-dark">{content.verseRef}</p>
            <p className="mt-3 text-sm leading-relaxed text-white/80 italic sm:text-base">
              {content.verseText}
            </p>
          </Reveal>
        </div>
      </SectionBackdrop>

      <SectionBackdrop imageUrl={LIFE_BACKGROUND}>
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-20">
          <div className="mb-10 grid gap-5 sm:mb-14 sm:grid-cols-2">
            <Reveal className={cn(CARD_CLASS, "p-6 text-center sm:p-8")}>
              <h3 className={TITLE_CLASS}>
                Temos uma Regra de <AccentWord>Vida</AccentWord>
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-white/80 italic sm:text-base">{content.ruleText}</p>
              <p className="mt-3 text-xs font-medium text-gold-dark">{content.ruleRef}</p>
            </Reveal>
            <Reveal delay={0.1} className={cn(CARD_CLASS, "p-6 text-center sm:p-8")}>
              <h3 className={TITLE_CLASS}>
                A Placa <AccentWord>Invisível</AccentWord>
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-white/80 italic sm:text-base">{content.badgeText}</p>
              <p className="mt-3 text-xs font-medium text-gold-dark">{content.badgeAuthor}</p>
            </Reveal>
          </div>

          <Reveal className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
            <h3 className={TITLE_CLASS}>
              Seguimos uma Lista de <AccentWord>Prioridades</AccentWord>
            </h3>
            <div className="mt-6 space-y-2.5">
              {PRIORIDADES.map((item) => (
                <div key={item.label} className="flex items-center justify-center gap-3">
                  <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold-dark">
                    {item.order}
                  </span>
                  <span className="text-base font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal className="mb-6 text-center sm:mb-8">
            <h3 className={TITLE_CLASS}>
              Qual o nosso <AccentWord>Propósito</AccentWord>?
            </h3>
          </Reveal>

          <StaggerGroup className={cn(MOBILE_CAROUSEL, "sm:grid-cols-3")}>
            {PROPOSITO.map((item) => (
              <StaggerItem
                key={item.title}
                className={cn(
                  CARD_CLASS,
                  MOBILE_CAROUSEL_ITEM,
                  "space-y-3 p-6 text-center transition-all duration-500 hover:-translate-y-1 hover:ring-1 hover:ring-gold/30"
                )}
              >
                <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-primary/15">
                  <item.icon className="size-5 text-gold" strokeWidth={1.5} />
                </div>
                <p className="font-heading text-xl font-semibold text-balance">{item.title}</p>
                <p className="text-sm leading-relaxed text-white/75">{item.text}</p>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </SectionBackdrop>
    </>
  )
}
