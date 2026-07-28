"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { NavLink } from "@/components/motion/nav-link"
import { MobileNav } from "@/components/public/mobile-nav"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { href: "/imoveis", label: "Todos os imóveis" },
  { href: "/comprar", label: "Comprar" },
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
        "fixed top-0 z-50 w-full transition-all duration-300",
        transparent
          ? "border-b border-transparent bg-transparent"
          : "border-b border-white/[0.06] bg-background/70 backdrop-blur-[18px] supports-backdrop-filter:bg-background/60"
      )}
    >
      <div className="relative mx-auto flex h-18 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Ícone + nome — só desktop, alinhado à esquerda junto do menu. */}
        <Link href="/" className="hidden items-center gap-2.5 md:flex">
          <Image
            src="/images/icon-mark-v3.png"
            alt=""
            width={36}
            height={36}
            priority
            className="size-9 translate-y-[3px]"
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

        {/* Logo completa (com o nome já desenhado nela) — só mobile,
            alinhada à esquerda como no desktop. */}
        <Link href="/" className="relative flex items-center md:hidden">
          {/* Brilho atrás da logo só faz sentido sobre a foto escura do
              Hero (transparent) — numa página com fundo claro e sólido
              ele só criava uma mancha acinzentada, deixando a logo mais
              apagada em vez de mais visível. */}
          {transparent ? (
            <div className="absolute inset-0 -z-10 scale-[2.2] rounded-full bg-black/35 blur-2xl" />
          ) : null}
          <Image
            src="/images/logo.png"
            alt={siteConfig.name}
            width={975}
            height={806}
            priority
            className={cn(
              "h-14 w-auto transition-[filter] duration-300",
              transparent
                ? "drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
                : "drop-shadow-[0_1px_3px_rgba(0,0,0,0.25)]"
            )}
          />
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
            "relative z-10 ml-auto transition-colors duration-500 md:hidden",
            transparent ? "text-white" : "text-foreground"
          )}
          aria-label="Abrir menu"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="size-6" />
        </button>
      </div>

      <MobileNav open={isOpen} onClose={() => setIsOpen(false)} />
    </header>
  )
}
