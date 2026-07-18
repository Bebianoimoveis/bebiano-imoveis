"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "motion/react"

// Parallax discreto (imagem se move mais devagar que o scroll) — usado no
// Hero. `strength` baixo de propósito: o briefing pede sutileza, não um
// efeito de scroll storytelling.
export function Parallax({
  children,
  className,
  strength = 60,
}: {
  children: React.ReactNode
  className?: string
  strength?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })
  const y = useTransform(scrollYProgress, [0, 1], [0, strength])

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }} className="size-full">
        {children}
      </motion.div>
    </div>
  )
}
