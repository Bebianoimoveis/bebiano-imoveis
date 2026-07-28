"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, Heart, Home, MessageCircle, Search } from "lucide-react"

import { useFavorites } from "@/hooks/use-favorites"
import { ContactSheet } from "@/components/public/contact-sheet"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/", label: "Início", icon: Home, match: (p: string) => p === "/" },
  { href: "/imoveis", label: "Buscar", icon: Search, match: (p: string) => p === "/imoveis" },
  { href: "/favoritos", label: "Favoritos", icon: Heart, match: (p: string) => p === "/favoritos" },
  { href: "/comprar", label: "Imóveis", icon: Building2, match: (p: string) => p === "/comprar" },
]

// Fixa embaixo só no mobile — no desktop a navegação já vive no header.
// z-40 fica abaixo do MobileNav (z-[100]) e do header (z-50) de propósito,
// já que o menu hambúrguer, quando aberto, deve cobrir esta barra também.
export function MobileTabBar() {
  const pathname = usePathname()
  const { favoriteIds } = useFavorites()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center border-t border-white/10 bg-primary/90 backdrop-blur-[18px] supports-backdrop-filter:bg-primary/80 md:hidden">
      {TABS.map((tab) => {
        const active = tab.match(pathname)
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            onClick={(e) => {
              // Já está na aba clicada — não tem rota pra navegar, então
              // rola suavemente até o topo em vez de ficar sem efeito.
              if (active) {
                e.preventDefault()
                window.scrollTo({ top: 0, behavior: "smooth" })
              }
            }}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
              active ? "text-gold" : "text-white/60"
            )}
          >
            <span className="relative">
              <Icon className={cn("size-5", active && "fill-gold/20")} strokeWidth={active ? 2.25 : 1.75} />
              {tab.href === "/favoritos" && favoriteIds.length > 0 ? (
                <span className="absolute -top-1 -right-1.5 flex size-3.5 items-center justify-center rounded-full bg-white text-[8px] font-semibold text-primary">
                  {favoriteIds.length > 9 ? "9+" : favoriteIds.length}
                </span>
              ) : null}
            </span>
            {tab.label}
          </Link>
        )
      })}
      <ContactSheet
        trigger={({ onClick }) => (
          <button
            type="button"
            onClick={onClick}
            className="flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-white/60 transition-colors"
          >
            <MessageCircle className="size-5" strokeWidth={1.75} />
            Contato
          </button>
        )}
      />
    </nav>
  )
}
