import Image from "next/image"

import { Reveal } from "@/components/motion/reveal"
import { AccentWord } from "@/components/public/accent-word"
import {
  DEFAULT_FOUNDERS_CONTENT,
  renderFounderText,
  type FounderContent,
  type FoundersContent,
} from "@/lib/founders-content"

const DEFAULT_PHOTO = "/images/about/bel-e-jairton.jpg"

function FounderStory({
  founder,
  baseYear,
  side,
}: {
  founder: FounderContent
  baseYear: number
  side: "left" | "right"
}) {
  const [opening, ...rest] = founder.paragraphs.map((paragraph) => renderFounderText(paragraph, baseYear))
  const paragraphClass = "text-sm leading-relaxed text-muted-foreground sm:text-base"

  return (
    <div className={side === "left" ? "space-y-4 lg:text-right" : "space-y-4"}>
      <h3 className="font-heading text-2xl font-semibold tracking-tight text-gold">{founder.name}</h3>
      <p className={paragraphClass}>{opening}</p>
      {/* No celular o resto da história fica recolhido atrás de
          "Continuar lendo" (a página ficava comprida demais); a partir de
          sm aparece tudo aberto. */}
      <details className="group sm:hidden">
        <summary className="cursor-pointer list-none text-sm font-medium text-gold [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">Continuar lendo</span>
          <span className="hidden group-open:inline">Mostrar menos</span>
        </summary>
        <div className="mt-3 space-y-4">
          {rest.map((paragraph, index) => (
            <p key={index} className={paragraphClass}>
              {paragraph}
            </p>
          ))}
        </div>
      </details>
      {rest.map((paragraph, index) => (
        <p key={index} className={`hidden sm:block ${paragraphClass}`}>
          {paragraph}
        </p>
      ))}
    </div>
  )
}

// Texto e foto editáveis em Configurações; sem nada salvo cai no padrão
// do slide institucional (ver founders-content.ts).
export function AboutFounders({ content = DEFAULT_FOUNDERS_CONTENT }: { content?: FoundersContent }) {
  const [first, second] = content.founders
  const photo = content.photoUrl || DEFAULT_PHOTO

  return (
    <section className="mx-auto max-w-6xl overflow-x-clip px-4 py-10 sm:px-6 sm:py-20">
      <Reveal className="mb-6 text-center sm:mb-14">
        <p className="text-sm font-medium tracking-widest text-gold-dark uppercase">Quem somos nós?</p>
        <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
          Conheça a nossa <AccentWord>História</AccentWord>
        </h2>
      </Reveal>

      <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-12">
        <Reveal x={-48} y={0} duration={0.8} className="order-2 lg:order-1">
          <FounderStory founder={first} baseYear={content.baseYear} side="left" />
        </Reveal>

        <Reveal delay={0.1} className="order-1 flex flex-col items-center gap-3 lg:order-2">
          <div className="relative size-44 overflow-hidden rounded-full ring-2 ring-gold/40 ring-offset-4 ring-offset-background sm:size-72">
            <Image
              src={photo}
              alt={`${first.name} e ${second.name}, fundadores da Bebiano Imóveis`}
              fill
              className="object-cover"
              sizes="288px"
            />
          </div>
          <p className="font-script text-2xl text-gold sm:text-3xl">
            {first.name} e {second.name}
          </p>
        </Reveal>

        <Reveal x={48} y={0} duration={0.8} delay={0.15} className="order-3">
          <FounderStory founder={second} baseYear={content.baseYear} side="right" />
        </Reveal>
      </div>
    </section>
  )
}
