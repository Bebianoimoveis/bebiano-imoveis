"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "motion/react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const SIDE_INITIAL = {
  right: { x: "100%" },
  left: { x: "-100%" },
  bottom: { y: "100%" },
} as const

const SIDE_CLASS = {
  right: "inset-y-0 right-0 h-full",
  left: "inset-y-0 left-0 h-full",
  bottom: "inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl",
} as const

// Drawer genérico — mesmo padrão (portal pro body + Motion) já usado em
// vários lugares do site público (MobileFiltersSheet, ContactSheet,
// MobileNav): um `backdrop-filter` em algum ancestral vira containing
// block de elementos `fixed`, então o portal evita depender de nenhum
// ancestral não ter transform/filter/backdrop-filter.
export function Sheet({
  open,
  onOpenChange,
  side = "right",
  title,
  children,
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  side?: "left" | "right" | "bottom"
  title?: string
  children: React.ReactNode
  className?: string
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-black/60"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={SIDE_INITIAL[side]}
            animate={{ x: 0, y: 0 }}
            exit={SIDE_INITIAL[side]}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className={cn(
              "absolute flex w-[85%] max-w-sm flex-col overflow-y-auto bg-popover shadow-2xl",
              SIDE_CLASS[side],
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {title ? (
              <div className="flex items-center justify-between border-b border-border/60 p-4">
                <p className="font-heading text-base font-semibold">{title}</p>
                <button
                  type="button"
                  aria-label="Fechar"
                  onClick={() => onOpenChange(false)}
                  className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : null}
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  )
}
