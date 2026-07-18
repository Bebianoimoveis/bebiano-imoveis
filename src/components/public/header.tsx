"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { Menu, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { NavLink } from "@/components/motion/nav-link"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { href: "/imoveis", label: "Todos os imóveis" },
  { href: "/comprar", label: "Comprar" },
  { href: "/alugar", label: "Alugar" },
]

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  // Só a home tem um Hero escuro em tela cheia por trás — nas outras
  // páginas o header já nasce sólido, senão o texto ficaria ilegível
  // sobre um fundo branco comum.
  const isHome = pathname === "/"
  const transparent = isHome && !scrolled

  useEffect(() => {
    if (!isHome) return
    function onScroll() {
      setScrolled(window.scrollY > 40)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [isHome])

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-colors duration-500",
        transparent
          ? "bg-transparent"
          : "border-b border-border/60 bg-background/90 backdrop-blur-md supports-backdrop-filter:bg-background/75"
      )}
    >
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/images/icon-mark.png"
            alt=""
            width={36}
            height={36}
            priority
            className="size-9"
          />
          <span
            className={cn(
              "font-heading text-lg font-semibold tracking-tight transition-colors duration-500",
              transparent ? "text-white" : "text-primary"
            )}
          >
            {siteConfig.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              className={cn(
                "transition-colors duration-500",
                transparent
                  ? "text-white/90 hover:text-white"
                  : "text-foreground/80 hover:text-primary"
              )}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:block">
          <Button
            asChild
            className={cn(
              transparent &&
                "border border-white/30 bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
            )}
          >
            <Link href="/imoveis">Buscar imóveis</Link>
          </Button>
        </div>

        <button
          type="button"
          className={cn(
            "md:hidden transition-colors duration-500",
            transparent ? "text-white" : "text-foreground"
          )}
          aria-label="Abrir menu"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="size-6" />
        </button>
      </div>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex flex-col bg-background md:hidden"
          >
            <div className="flex h-18 items-center justify-between px-4 sm:px-6">
              <Image
                src="/images/icon-mark.png"
                alt=""
                width={36}
                height={36}
                className="size-9"
              />
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setIsOpen(false)}
                className="text-foreground"
              >
                <X className="size-6" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col justify-center gap-2 px-6 pb-24">
              {NAV_LINKS.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * index, duration: 0.4 }}
                >
                  <Link
                    href={link.href}
                    className="font-heading block py-3 text-3xl font-semibold tracking-tight text-foreground"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
