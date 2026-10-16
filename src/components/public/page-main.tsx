"use client"

import { usePathname } from "next/navigation"

import { hasFullBleedHero } from "@/lib/hero-pages"
import { cn } from "@/lib/utils"

// O header é `fixed` para poder ficar transparente sobre o Hero (home e
// Sobre). Nas outras páginas (sem Hero em tela cheia) o conteúdo precisa
// de um respiro no topo do tamanho do header, senão fica escondido atrás.
export function PageMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const withHero = hasFullBleedHero(pathname)

  return (
    <main className={cn("flex-1 pb-16 md:pb-0", !withHero && "pt-18")}>
      {children}
    </main>
  )
}
