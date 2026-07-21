"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { ArrowDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Parallax } from "@/components/motion/parallax"
import { HeroBackground } from "@/components/public/hero-background"
import { HeroSearch } from "@/components/public/hero-search"
import { siteConfig } from "@/config/site"

type City = { id: string; name: string; state: string }

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
}

const item = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function Hero({ cities }: { cities: City[] }) {
  return (
    <section className="relative flex min-h-[100svh] items-end overflow-hidden bg-primary">
      <Parallax className="absolute inset-0" strength={80}>
        {/* "Câmera respirando": zoom quase imperceptível, independente do
            parallax de scroll (que já cuida do eixo Y) — puramente
            decorativo, roda sempre, não reage a interação. */}
        <motion.div
          className="size-full"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        >
          <HeroBackground />
        </motion.div>
      </Parallax>

      {/* Overlay em três camadas: (1) vertical, mais escuro embaixo onde
          fica todo o texto e a busca; (2) horizontal, mais escuro à
          esquerda (coluna do texto) e mais aberto à direita, pra nunca
          competir com os rostos da foto; (3) mistura vinho da marca em
          tom mais forte que uma foto crua, lendo como grade/atmosfera
          "de estúdio" em vez de flagrante de grupo. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/50 to-black/25" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />
      <div className="absolute inset-0 bg-primary/30 mix-blend-multiply" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={container}
        className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-24 pb-8 sm:px-6 sm:pt-40 sm:pb-36"
      >
        <motion.p
          variants={item}
          className="text-[0.65rem] font-medium tracking-[0.2em] text-gold-light uppercase sm:text-sm"
        >
          {siteConfig.city} · {siteConfig.state}
        </motion.p>
        <motion.h1
          variants={item}
          className="font-heading mt-2 max-w-3xl text-balance text-[1.75rem] leading-[1.15] font-semibold tracking-tight text-white sm:mt-4 sm:text-7xl sm:leading-tight"
        >
          Mais do que imóveis. Encontramos o lugar certo para sua história.
        </motion.h1>
        <motion.p
          variants={item}
          className="mt-3 hidden max-w-lg text-base text-white/80 sm:mt-5 sm:block sm:text-lg"
        >
          A {siteConfig.name} conecta você aos melhores imóveis novos e
          usados para comprar na região, com atendimento próximo,
          transparente e especializado.
        </motion.p>

        <motion.div variants={item} className="mt-5 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-4">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.25 }}>
            <Button
              asChild
              className="h-10 w-full px-5 text-sm bg-gold text-accent-foreground shadow-lg shadow-black/20 hover:bg-gold-light hover:shadow-xl hover:shadow-black/25 sm:h-11 sm:w-auto sm:px-6 sm:text-base"
            >
              <Link href="/imoveis">Ver imóveis disponíveis</Link>
            </Button>
          </motion.div>
          {siteConfig.whatsapp ? (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.25 }}>
              <Button
                asChild
                variant="outline"
                className="h-10 w-full px-5 text-sm border-white/30 bg-white/5 text-white backdrop-blur-md hover:bg-white/15 hover:text-white sm:h-11 sm:w-auto sm:px-6 sm:text-base"
              >
                <a
                  href={`https://wa.me/${siteConfig.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Falar com um corretor
                </a>
              </Button>
            </motion.div>
          ) : null}
        </motion.div>

        <motion.div variants={item} className="relative z-20 mt-6 sm:mt-14 sm:-mb-12 lg:-mb-16">
          <HeroSearch cities={cities} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.6 }}
        className="pointer-events-none absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 sm:bottom-10 sm:block"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown className="size-5 text-white/70" />
        </motion.div>
      </motion.div>
    </section>
  )
}
