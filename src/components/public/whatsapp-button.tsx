import { MessageCircle } from "lucide-react"

import { siteConfig } from "@/config/site"

export function WhatsAppButton() {
  if (!siteConfig.whatsapp) return null

  const digits = siteConfig.whatsapp.replace(/\D/g, "")
  const href = `https://wa.me/${digits}?text=${encodeURIComponent(
    "Olá! Vim pelo site da Bebiano Imóveis e gostaria de mais informações."
  )}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
    >
      <MessageCircle className="size-6" />
    </a>
  )
}
