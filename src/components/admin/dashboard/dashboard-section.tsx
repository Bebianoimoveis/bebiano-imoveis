"use client"

import { motion } from "motion/react"

// Cascata de entrada do dashboard — cada bloco (cabeçalho, KPIs, gráficos,
// funil, listas, ações rápidas) entra com um pequeno atraso em relação ao
// anterior, em vez de tudo aparecer de uma vez.
export function DashboardSection({
  index,
  className,
  children,
}: {
  index: number
  className?: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
