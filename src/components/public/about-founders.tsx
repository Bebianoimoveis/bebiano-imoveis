import Image from "next/image"

import { Reveal } from "@/components/motion/reveal"
import { AccentWord } from "@/components/public/accent-word"

// Texto do slide "Quem somos nós? Conheça a nossa história" da
// apresentação institucional, na voz de cada um dos fundadores — só
// corrigidos erros de digitação. As idades são as de outubro/2026.
const FOUNDERS = [
  {
    name: "Bel",
    paragraphs: [
      "Conheci Jesus com 19 anos, hoje tenho 42 anos de idade, sou mãe, sou esposa, e comecei a empreender com 27 anos, há 15 anos atrás.",
      "Meu 1º emprego foi como caixa de supermercado, após em loja infantil, depois como auxiliar administrativo, onde estudei e me formei em Administração. Fui Diretora de Vendas na Mary Kay do Brasil, e após trabalhei como Representante Comercial, aí sim conheci e me apaixonei pela Corretagem.",
      "Sempre amei SERVIR e, por amar pessoas, sempre tive a oportunidade de liderar. De forma natural as coisas sempre vinham na minha mão, onde entendi que Deus queria me usar ali, ajudando, guiando e liderando pessoas pra glória dEle.",
    ],
  },
  {
    name: "Jairton",
    paragraphs: [
      "Com 6 anos, tive meu primeiro contato com Jesus, minha conversão aconteceu com 29 anos, hoje tenho 43 anos de idade, sou pai, sou esposo e trabalho há 25 anos na área de indústria.",
      "Comecei a trabalhar com 14 anos, em supermercado, também fui ajudante de obras e após iniciei na indústria. Na De Carlo fiquei 7 anos e atualmente trabalho há 18 anos na AGCO. Mas sempre pensei em mudar de área e agora a oportunidade chegou.",
      "Gosto de ouvir as pessoas, sempre tive bom relacionamento pois tenho paciência com o ser humano, e por isso também sempre SERVI as pessoas ao meu redor, seja no trabalho ou na igreja, onde liderava homens e famílias.",
    ],
  },
]

const PHOTO = "/images/about/bel-e-jairton.jpg"

function FounderStory({ founder, side }: { founder: (typeof FOUNDERS)[number]; side: "left" | "right" }) {
  return (
    <div className={side === "left" ? "space-y-4 lg:text-right" : "space-y-4"}>
      <h3 className="font-heading text-2xl font-semibold tracking-tight text-gold">{founder.name}</h3>
      {founder.paragraphs.map((paragraph) => (
        <p key={paragraph} className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          {paragraph}
        </p>
      ))}
    </div>
  )
}

export function AboutFounders() {
  const [bel, jairton] = FOUNDERS

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
          <FounderStory founder={bel} side="left" />
        </Reveal>

        <Reveal delay={0.1} className="order-1 flex flex-col items-center gap-4 lg:order-2">
          <div className="relative size-64 overflow-hidden rounded-full ring-2 ring-gold/40 ring-offset-4 ring-offset-background sm:size-72">
            <Image
              src={PHOTO}
              alt="Bel e Jairton, fundadores da Bebiano Imóveis"
              fill
              className="object-cover"
              sizes="288px"
            />
          </div>
          <p className="font-script text-3xl text-gold">Bel e Jairton</p>
        </Reveal>

        <Reveal delay={0.2} className="order-3">
          <FounderStory founder={jairton} side="right" />
        </Reveal>
      </div>
    </section>
  )
}
