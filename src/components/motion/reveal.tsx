"use client"

import { motion, type Variants } from "motion/react"

type RevealProps = {
  children: React.ReactNode
  className?: string
  delay?: number
  /** Distância (px) de onde o elemento "chega" — 0 desativa o deslocamento. */
  y?: number
  /** Duração em segundos. */
  duration?: number
  as?: "div" | "li"
}

// Único componente de "entrada ao rolar" usado no site inteiro — mantém a
// mesma curva de animação (easing/duração) em toda parte para não parecer
// um mosaico de efeitos diferentes. `once: true` evita reanimar toda vez
// que o elemento entra/sai da viewport (mais barato e menos cansativo).
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  duration = 0.6,
  as = "div",
}: RevealProps) {
  const variants: Variants = {
    hidden: { opacity: 0, y },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration, delay, ease: [0.22, 1, 0.36, 1] },
    },
  }

  const MotionTag = as === "li" ? motion.li : motion.div

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={variants}
    >
      {children}
    </MotionTag>
  )
}
