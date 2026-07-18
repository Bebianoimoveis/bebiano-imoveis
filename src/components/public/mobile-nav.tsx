"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import { MessageCircle, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/site"

const NAV_LINKS = [
  { href: "/imoveis", label: "Todos os imóveis" },
  { href: "/comprar", label: "Comprar" },
  { href: "/alugar", label: "Alugar" },
]

// Portal para document.body: o menu é `fixed inset-0`, mas se ficar
// aninhado dentro do <header>, o backdrop-blur do header (backdrop-filter)
// vira o "containing block" desse fixed por especificação do CSS — o
// inset-0 passa a resolver contra a caixa de 72px do header, não contra o
// viewport, colapsando o menu numa faixa minúscula. Portal evita depender
// de nenhum ancestral não ter transform/filter/backdrop-filter.
export function MobileNav({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
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
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex flex-col bg-background md:hidden"
        >
          <div className="flex h-18 items-center justify-between px-4 sm:px-6">
            <Image
              src="/images/icon-mark-v3.png"
              alt=""
              width={32}
              height={32}
              className="size-8"
            />
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={onClose}
              className="flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
            >
              <X className="size-5" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col items-center justify-center gap-1 px-6">
            {NAV_LINKS.map((link, index) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * index, duration: 0.35 }}
              >
                <Link
                  href={link.href}
                  className="block px-4 py-3 text-center text-xl font-medium tracking-tight text-foreground/80 transition-colors hover:text-primary"
                  onClick={onClose}
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.35 }}
            className="flex flex-col gap-3 px-6 pb-10"
          >
            {siteConfig.whatsapp ? (
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <a
                  href={`https://wa.me/${siteConfig.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                >
                  <MessageCircle className="size-4" />
                  Falar com um corretor
                </a>
              </Button>
            ) : null}
            <Button
              asChild
              size="lg"
              className="rounded-full bg-gold text-accent-foreground hover:bg-gold-light"
            >
              <Link href="/imoveis" onClick={onClose}>
                Buscar imóveis
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  )
}
