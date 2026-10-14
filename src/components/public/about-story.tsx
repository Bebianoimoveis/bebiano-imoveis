import Image from "next/image"

import { Reveal } from "@/components/motion/reveal"
import { AccentWord } from "@/components/public/accent-word"
import { SectionBackdrop } from "@/components/public/section-backdrop"

const BACKGROUND = "/images/about/story.jpg"

// Exportado pra Configurações usar como valor inicial do campo "Quem
// somos" — sem isso, a pessoa via um campo vazio no admin enquanto o
// site público mostrava esse texto padrão, sem saber que era esse o
// texto "real" que precisava editar.
// Texto do slide "Nome e Logo" da apresentação institucional da cliente.
const DEFAULT_STORY_TEXT =
  "Bebiano é uma forma abreviada de Viviano, um nome latino que significa “Vivo”. Em algumas regiões do Brasil, “Bebiano” se refere a um Candeeiro (Luminária), que tem a finalidade de iluminar e guiar através de uma chama viva, distribuindo a luz ao ambiente. E esta será nossa missão: iluminar."

// Texto padrão anterior. O formulário de Configurações abria com ele já
// preenchido e o gravava no banco ao salvar qualquer outra coisa — então
// ter esse texto salvo não significa que a cliente o escolheu, e ele
// deve dar lugar ao padrão novo.
const LEGACY_DEFAULT_STORY_TEXTS = [
  "A Bebiano Imóveis nasceu com um propósito simples: transformar o processo de compra, venda e locação em uma experiência transparente, segura e humana. Mais do que negociar imóveis, construímos relacionamentos duradouros. Cada cliente possui uma necessidade única, e nosso compromisso é oferecer atendimento personalizado em todas as etapas.",
]

export function resolveStoryText(aboutText: string | null | undefined) {
  const text = aboutText?.trim()
  if (!text || LEGACY_DEFAULT_STORY_TEXTS.includes(text)) return DEFAULT_STORY_TEXT
  return text
}

export function AboutStory({
  aboutText,
  imageUrl,
}: {
  aboutText: string | null
  imageUrl: string
}) {
  return (
    <SectionBackdrop imageUrl={BACKGROUND}>
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16">
        <Reveal className="order-2 lg:order-1">
          <p className="text-sm font-medium tracking-widest text-gold-dark uppercase">
            Nome e logo
          </p>
          <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight text-balance">
            Bebiano significa <AccentWord>Candeeiro</AccentWord>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/80 sm:text-lg">
            {resolveStoryText(aboutText)}
          </p>
        </Reveal>

        <Reveal delay={0.1} className="order-1 lg:order-2">
          <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-full ring-1 ring-border/60">
            <Image
              src={imageUrl}
              alt="Bebiano Imóveis"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 90vw, 400px"
            />
          </div>
        </Reveal>
      </div>
    </SectionBackdrop>
  )
}
