"use client"

import { WhatsAppIcon } from "@/components/shared/whatsapp-icon"

// Botão de WhatsApp dentro do card de corretor(a) — precisa ser um Client
// Component porque intercepta o clique (stopPropagation) para não navegar
// para o perfil quando o visitante só quer abrir o WhatsApp direto.
export function RealtorWhatsappButton({
  href,
  name,
}: {
  href: string
  name: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      aria-label={`Falar com ${name} no WhatsApp`}
      className="absolute top-3 right-3 z-20 flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white shadow-sm backdrop-blur-md transition-all hover:scale-105 hover:bg-primary"
    >
      <WhatsAppIcon className="size-4" />
    </a>
  )
}
