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

const BASE_NAV_LINKS = [
  { href: "/imoveis", label: "Todos os imóveis" },
  { href: "/comprar", label: "Comprar" },
]

const RENT_LINK = { href: "/alugar", label: "Alugar" }

export function Header({ rentalEnabled = false }: { rentalEnabled?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const navLinks = rentalEnabled ? [...BASE_NAV_LINKS, RENT_LINK] : BASE_NAV_LINKS
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
          : // Sem backdrop-blur: header fixo, recompõe a cada frame de
            // scroll (o conteúdo passa por baixo o tempo todo) — custo
            // contínuo, não só na primeira pintura. Fundo sólido opaco
            // mantém a leitura sem esse custo. Marsala mais escuro que o
            // --primary padrão (mesmo tom do botão de WhatsApp), a pedido
            // da cliente.
            "border-b border-white/10 bg-[#4a0c1c]"
      )}
    >
      <div className="relative mx-auto flex h-18 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo completa (com o nome já desenhado nela), alinhada à
            esquerda em todos os tamanhos de tela. */}
        <Link href="/" className="relative flex items-center">
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
              "h-14 w-auto transition-[filter] duration-300 md:h-16",
              transparent
                ? "drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
                : "drop-shadow-[0_1px_3px_rgba(0,0,0,0.25)]"
            )}
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              className="text-white/85 transition-colors duration-500 hover:text-white"
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:block">
          <Button
            asChild
            className={cn(
              transparent
                ? "border border-white/30 bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
                : "bg-gold text-accent-foreground hover:bg-gold-light"
            )}
          >
            <Link href="/imoveis">Buscar imóveis</Link>
          </Button>
        </div>

        <button
          type="button"
          className="relative z-10 ml-auto text-white transition-colors duration-500 md:hidden"
          aria-label="Abrir menu"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="size-6" />
        </button>
      </div>

      <MobileNav open={isOpen} onClose={() => setIsOpen(false)} rentalEnabled={rentalEnabled} />
    </header>
  )
}
