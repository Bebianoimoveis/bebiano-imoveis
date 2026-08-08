import Image from "next/image"

import { Reveal } from "@/components/motion/reveal"
import { AccentWord } from "@/components/public/accent-word"

const DEFAULT_STORY_TEXT =
  "A Bebiano Imóveis nasceu com um propósito simples: transformar o processo de compra, venda e locação em uma experiência transparente, segura e humana. Mais do que negociar imóveis, construímos relacionamentos duradouros. Cada cliente possui uma necessidade única, e nosso compromisso é oferecer atendimento personalizado em todas as etapas."

export function AboutStory({
  aboutText,
  imageUrl,
}: {
  aboutText: string | null
  imageUrl: string
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
        <Reveal className="order-2 lg:order-1">
          <p className="text-sm font-medium tracking-widest text-gold-dark uppercase">
            Nossa trajetória
          </p>
          <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
            Nossa <AccentWord>História</AccentWord>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {aboutText || DEFAULT_STORY_TEXT}
          </p>
        </Reveal>

        <Reveal delay={0.1} className="order-1 lg:order-2">
          <div className="relative aspect-4/5 overflow-hidden rounded-[20px] ring-1 ring-border/60 sm:rounded-3xl">
            <Image
              src={imageUrl}
              alt="Bebiano Imóveis"
              fill
              className="object-cover object-top"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
