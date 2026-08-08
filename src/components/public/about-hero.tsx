"use client"

import Link from "next/link"
import { motion } from "motion/react"

import { Button } from "@/components/ui/button"
import { Parallax } from "@/components/motion/parallax"
import { HeroBackground } from "@/components/public/hero-background"
import { AccentWord } from "@/components/public/accent-word"
import { useAttributedWhatsapp } from "@/hooks/use-attributed-whatsapp"

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

// Hero da página "Sobre Nós" — mesma receita visual do Hero da home
// (Parallax discreto + overlay em camadas + entrada escalonada), só que
// mais compacto (min-h-[70vh] em vez de 100svh) já que não carrega a
// busca de imóveis.
export function AboutHero({ heroImageUrl }: { heroImageUrl?: string | null }) {
  const { phone } = useAttributedWhatsapp()

  return (
    <section className="relative flex min-h-[70vh] items-end overflow-hidden bg-primary sm:min-h-[75vh]">
      <Parallax className="absolute inset-0" strength={60}>
        <HeroBackground posterUrl={heroImageUrl} />
      </Parallax>

      <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/50 to-black/25" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />
      <div className="absolute inset-0 bg-primary/30 mix-blend-multiply" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={container}
        className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-24 pb-14 sm:px-6 sm:pt-32 sm:pb-20"
      >
        <motion.p
          variants={item}
          className="text-[0.65rem] font-medium tracking-[0.2em] text-gold-light uppercase sm:text-sm"
        >
          Quem somos
        </motion.p>
        <motion.h1
          variants={item}
          className="font-heading mt-2 max-w-3xl text-balance text-[1.9rem] leading-[1.15] font-semibold tracking-tight text-white sm:mt-4 sm:text-6xl sm:leading-tight"
        >
          Mais do que vender imóveis. Realizamos <AccentWord>conquistas</AccentWord>.
        </motion.h1>
        <motion.p
          variants={item}
          className="mt-4 max-w-lg text-base text-white/80 sm:mt-5 sm:text-lg"
        >
          Na Bebiano Imóveis acreditamos que cada imóvel representa uma nova
          fase da vida.
        </motion.p>

        <motion.div
          variants={item}
          className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-4"
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.25 }}>
            <Button
              asChild
              className="h-10 w-full px-5 text-sm bg-gold text-accent-foreground shadow-lg shadow-black/20 hover:bg-gold-light hover:shadow-xl hover:shadow-black/25 sm:h-11 sm:w-auto sm:px-6 sm:text-base"
            >
              <Link href="/imoveis">Conheça nossos imóveis</Link>
            </Button>
          </motion.div>
          {phone ? (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.25 }}>
              <Button
                asChild
                variant="outline"
                className="h-10 w-full px-5 text-sm border-white/30 bg-white/5 text-white backdrop-blur-md hover:bg-white/15 hover:text-white sm:h-11 sm:w-auto sm:px-6 sm:text-base"
              >
                <a
                  href={`https://wa.me/${phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Falar com um especialista
                </a>
              </Button>
            </motion.div>
          ) : null}
        </motion.div>
      </motion.div>
    </section>
  )
}
