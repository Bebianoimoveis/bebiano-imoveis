"use client"

import { useRef } from "react"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"

// Camada de fundo que se move mais devagar que o scroll enquanto a seção
// atravessa a tela (entra por baixo → sai por cima). A camada é 30% mais
// alta que a seção (15% sobrando em cima e embaixo) pra nunca aparecer
// borda vazia durante o deslocamento de ±10%.
export function ScrollParallax({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"])

  return (
    <div ref={ref} className={className}>
      <motion.div style={reduceMotion ? undefined : { y }} className="absolute inset-x-0 -top-[15%] h-[130%]">
        {children}
      </motion.div>
    </div>
  )
}
