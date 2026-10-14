"use client"

import { motion, useScroll, useSpring } from "motion/react"

// Barrinha dourada no topo da tela que enche conforme a página é lida.
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 })

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-1 origin-left bg-gradient-to-r from-gold-dark via-gold to-gold-light"
    />
  )
}
