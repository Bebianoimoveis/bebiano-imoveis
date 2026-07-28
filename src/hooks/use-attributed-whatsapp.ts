"use client"

import { useEffect, useState } from "react"

import { siteConfig } from "@/config/site"

type WhatsappTarget = {
  phone: string
  realtorName: string | null
}

// Começa com o número institucional (o que já é renderizado no HTML
// estático) e troca pro corretor atribuído assim que a resposta chega —
// evita ter que tornar páginas estáticas (a home, por exemplo) dinâmicas
// só por causa do botão de WhatsApp.
export function useAttributedWhatsapp(): WhatsappTarget {
  const [target, setTarget] = useState<WhatsappTarget>({
    phone: siteConfig.whatsapp,
    realtorName: null,
  })

  useEffect(() => {
    let cancelled = false
    fetch("/api/attribution/whatsapp")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: WhatsappTarget | null) => {
        if (!cancelled && data?.phone) setTarget(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return target
}
