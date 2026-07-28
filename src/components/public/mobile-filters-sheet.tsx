"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "motion/react"
import { SlidersHorizontal, X } from "lucide-react"

import { Button } from "@/components/ui/button"

// Mesmo motivo do MobileNav: portal pro body evita que um backdrop-filter
// de algum ancestral vire containing block do `fixed` e quebre o inset-0.
export function MobileFiltersSheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full rounded-full lg:hidden"
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal className="size-4" />
        Filtros
      </Button>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-[100] flex flex-col bg-black/50 lg:hidden"
                  onClick={() => setOpen(false)}
                >
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 32, stiffness: 320 }}
                    className="mt-auto max-h-[85vh] overflow-y-auto rounded-t-2xl bg-background p-5 pb-8"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <p className="font-heading text-lg font-semibold">Filtros</p>
                      <button
                        type="button"
                        aria-label="Fechar filtros"
                        onClick={() => setOpen(false)}
                        className="flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
                      >
                        <X className="size-5" />
                      </button>
                    </div>
                    {children}
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}
    </>
  )
}
