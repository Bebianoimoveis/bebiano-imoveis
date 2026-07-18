"use client"

import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

// O header é `fixed` para poder ficar transparente sobre o Hero da home.
// Em qualquer outra página (sem Hero em tela cheia) o conteúdo precisa de
// um respiro no topo do tamanho do header, senão fica escondido atrás dele.
export function PageMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHome = pathname === "/"

  return (
    <main className={cn("flex-1", !isHome && "pt-18")}>{children}</main>
  )
}
