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
  return (
    <div className={side === "left" ? "space-y-4 lg:text-right" : "space-y-4"}>
      <h3 className="font-heading text-2xl font-semibold tracking-tight text-gold">{founder.name}</h3>
      {founder.paragraphs.map((paragraph, index) => (
        <p key={index} className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          {renderFounderText(paragraph, baseYear)}
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
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <Reveal className="mb-10 text-center sm:mb-14">
        <p className="text-sm font-medium tracking-widest text-gold-dark uppercase">Quem somos nós?</p>
        <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
          Conheça a nossa <AccentWord>História</AccentWord>
        </h2>
      </Reveal>

      <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto_1fr] lg:gap-12">
        <Reveal className="order-2 lg:order-1">
          <FounderStory founder={first} baseYear={content.baseYear} side="left" />
        </Reveal>

        <Reveal delay={0.1} className="order-1 flex flex-col items-center gap-4 lg:order-2">
          <div className="relative size-64 overflow-hidden rounded-full ring-2 ring-gold/40 ring-offset-4 ring-offset-background sm:size-72">
            <Image
              src={photo}
              alt={`${first.name} e ${second.name}, fundadores da Bebiano Imóveis`}
              fill
              className="object-cover"
              sizes="288px"
            />
          </div>
          <p className="font-script text-3xl text-gold">
            {first.name} e {second.name}
          </p>
        </Reveal>

        <Reveal delay={0.2} className="order-3">
          <FounderStory founder={second} baseYear={content.baseYear} side="right" />
        </Reveal>
      </div>
    </section>
  )
}
