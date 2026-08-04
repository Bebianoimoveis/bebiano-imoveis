"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView } from "motion/react"

import { AccentWord } from "@/components/public/accent-word"

// Números reais confirmados pela cliente. "Imóveis negociados" e "sonhos
// realizados" (placeholder do briefing original) foram removidos a
// pedido dela.
const STATS = [
  { value: 1, suffix: "", label: "ano de mercado" },
  { value: 1000, suffix: "+", label: "clientes atendidos com transparência e segurança" },
  { value: 100, suffix: "%", label: "satisfação" },
] as const

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return

    const duration = 1600
    const start = performance.now()

    let frame: number
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      // easeOutCubic — desacelera perto do final, sensação mais "premium"
      // que uma contagem linear.
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(value * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, value])

  return (
    <p ref={ref} className="font-heading text-4xl font-semibold tracking-tight text-gold sm:text-5xl">
      {display.toLocaleString("pt-BR")}
      {suffix}
    </p>
  )
}

export function AboutStats() {
  return (
    <section className="border-t border-b border-border/60 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 text-center sm:mb-14"
        >
          <p className="text-sm font-medium tracking-widest text-gold-dark uppercase">
            Números que contam nossa história
          </p>
          <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
            Resultados em <AccentWord>números</AccentWord>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1.5 text-center">
              <Counter value={stat.value} suffix={stat.suffix} />
              <p className="text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
