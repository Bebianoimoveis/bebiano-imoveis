"use client"

import { useEffect } from "react"

// Navegações via <Link>/router do Next.js já sobem a página pro topo
// sozinhas. O caso que falta é o F5/recarregar: aí é o próprio navegador
// quem decide a posição do scroll (restauração nativa), e por padrão ele
// tenta manter onde o usuário estava antes de recarregar — não no topo.
// Desligamos essa restauração nativa e forçamos o topo no primeiro
// carregamento de cada página.
export function ScrollRestorationGuard() {
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual"
    }
    window.scrollTo(0, 0)
  }, [])

  return null
}
