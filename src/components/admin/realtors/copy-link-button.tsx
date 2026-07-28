"use client"

import { Copy } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

export function CopyLinkButton({ link }: { link: string }) {
  async function handleCopy() {
    await navigator.clipboard.writeText(link)
    toast.success("Link copiado para a área de transferência.")
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
      <Copy className="size-4" />
      Copiar link
    </Button>
  )
}
