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
    // No mobile fica mais alta que a barra de navegação fixa (que já tem
    // seu próprio atalho "Contato"), com folga extra pra não encostar no
    // rodapé quando a página é rolada até o fim.
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      // Marsala mais escuro que o --primary padrão (só pra este botão
      // flutuante) e o ícone em dourado forte, a pedido da cliente.
      className="fixed right-5 bottom-28 z-50 flex size-14 items-center justify-center rounded-full bg-[#4a0c1c] text-gold shadow-lg transition-transform hover:scale-105 md:bottom-5"
    >
      <WhatsAppIcon className="size-6" />
    </a>
  )
}
