"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "motion/react"
import { ArrowDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Parallax } from "@/components/motion/parallax"
import { HeroSearch } from "@/components/public/hero-search"
import { siteConfig } from "@/config/site"

type City = { id: string; name: string; state: string }

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
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
    <section className="relative flex min-h-screen items-end overflow-hidden bg-primary">
      <Parallax className="absolute inset-0" strength={100}>
        <Image
          src="/images/hero-bg.jpg"
          alt="Fachada de casa moderna ao entardecer"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </Parallax>

      {/* Overlay escuro para legibilidade do texto, com leve tom vinho para
          reforçar a marca sem depender de cor sólida sobre a foto. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />
      <div className="absolute inset-0 bg-primary/15 mix-blend-multiply" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={container}
        className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-32 pb-28 sm:px-6 sm:pt-40 sm:pb-36"
      >
        <motion.p
          variants={item}
          className="text-sm font-medium tracking-[0.2em] text-gold-light uppercase"
        >
          {siteConfig.city} · {siteConfig.state}
        </motion.p>
        <motion.h1
          variants={item}
          className="font-heading mt-4 max-w-3xl text-balance text-5xl font-semibold tracking-tight text-white sm:text-7xl"
        >
          Encontre o imóvel certo para o seu próximo capítulo
        </motion.h1>
        <motion.p
          variants={item}
          className="mt-5 max-w-lg text-lg text-white/80"
        >
          A {siteConfig.name} conecta você aos melhores imóveis para comprar
          ou alugar na região, com atendimento próximo e transparente.
        </motion.p>

        <motion.div variants={item} className="mt-8 flex flex-wrap gap-4">
          <Button
            asChild
            size="lg"
            className="bg-gold text-accent-foreground hover:bg-gold-light"
          >
            <Link href="/imoveis">Ver imóveis disponíveis</Link>
          </Button>
          {siteConfig.whatsapp ? (
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/5 text-white backdrop-blur-md hover:bg-white/15 hover:text-white"
            >
              <a
                href={`https://wa.me/${siteConfig.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar com um corretor
              </a>
            </Button>
          ) : null}
        </motion.div>

        <motion.div variants={item} className="relative z-20 mt-14 -mb-12 sm:-mb-16">
          <HeroSearch cities={cities} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.6 }}
        className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 sm:bottom-10"
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
