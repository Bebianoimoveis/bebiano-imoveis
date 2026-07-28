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
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed right-5 bottom-[5.5rem] z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 md:bottom-5"
    >
      <WhatsAppIcon className="size-6" />
    </a>
  )
}
