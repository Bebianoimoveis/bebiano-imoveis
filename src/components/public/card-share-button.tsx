"use client"

import { Share2 } from "lucide-react"
import { toast } from "sonner"

// Versão compacta (só ícone) do ShareButton — usada dentro dos cards de
// imóvel, onde não há espaço para o botão rotulado da página de detalhe.
export function CardShareButton({ title, path }: { title: string; path: string }) {
  async function handleShare(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    const url = `${window.location.origin}${path}`

    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch {
        // usuário cancelou o compartilhamento — não é um erro a reportar
      }
      return
    }

    await navigator.clipboard.writeText(url)
    toast.success("Link copiado para a área de transferência.")
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Compartilhar imóvel"
      // Sem backdrop-blur: mesmo motivo do FavoriteButton — se repete em
      // cada card de imóvel numa grade, blur multiplicado pesa no scroll.
      className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white shadow-sm transition-all hover:scale-105"
    >
      <Share2 className="size-4" />
    </button>
  )
}
