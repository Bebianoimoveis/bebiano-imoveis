"use client"

import { WhatsAppIcon } from "@/components/shared/whatsapp-icon"
import { useAttributedWhatsapp } from "@/hooks/use-attributed-whatsapp"

// Componente-folha separado do resto do Footer (que é Server Component)
// só pra isolar o uso do hook client-side — mantém o footer estático,
// só este link específico troca de número depois de montado.
export function FooterWhatsappLink({ className }: { className: string }) {
  const { phone } = useAttributedWhatsapp()
  if (!phone) return null

  return (
    <a
      href={`https://wa.me/${phone.replace(/\D/g, "")}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className={className}
    >
      <WhatsAppIcon className="size-5" />
    </a>
  )
}
