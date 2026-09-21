"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

const REFRESH_INTERVAL_MS = 30_000

// Atualiza os dados de qualquer página do admin sozinho, sem precisar
// apertar F5 — importante pra pegar mudança feita por OUTRA pessoa (um
// lead novo chegando pelo site, a Bel editando algo em outro
// computador etc.), não só as próprias ações de quem está vendo a tela
// (essas já atualizam na hora via router.refresh() logo após a ação).
//
// router.refresh() só busca os dados de novo nos Server Components da
// rota atual — não reseta estado de componente client (não fecha
// diálogo aberto, não apaga o que já foi digitado num formulário), só
// troca os dados que vieram do servidor. Pausa quando a aba não está
// visível, pra não gastar consulta no banco à toa com a aba em segundo
// plano.
export function AutoRefresh() {
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh()
      }
    }, REFRESH_INTERVAL_MS)

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        router.refresh()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [router])

  return null
}
