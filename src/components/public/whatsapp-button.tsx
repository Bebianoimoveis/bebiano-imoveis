"use client"

import { WhatsAppIcon } from "@/components/shared/whatsapp-icon"
import { useAttributedWhatsapp } from "@/hooks/use-attributed-whatsapp"

export function WhatsAppButton() {
  const { phone, realtorName } = useAttributedWhatsapp()
  if (!phone) return null

  const digits = phone.replace(/\D/g, "")
  const greeting = realtorName
    ? `Olá ${realtorName}! Vim pelo site da Bebiano Imóveis e gostaria de mais informações.`
    : "Olá! Vim pelo site da Bebiano Imóveis e gostaria de mais informações."
  const href = `https://wa.me/${digits}?text=${encodeURIComponent(greeting)}`

  return (
    // Escondido no mobile: a barra de navegação fixa já tem um atalho
    // "Contato" pro WhatsApp, então a bolha flutuante ficava redundante
    // e sobrepondo o rodapé quando a página é rolada até o fim. No
    // desktop, sem essa barra, ela continua sendo o único atalho.
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed right-5 bottom-5 z-50 hidden size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 md:flex"
    >
      <WhatsAppIcon className="size-6" />
    </a>
  )
}
