"use client"

import { Share2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

export function ShareButton({ title }: { title: string }) {
  async function handleShare() {
    const url = window.location.href

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
    <Button type="button" variant="outline" onClick={handleShare}>
      <Share2 className="size-4" />
      Compartilhar
    </Button>
  )
}
