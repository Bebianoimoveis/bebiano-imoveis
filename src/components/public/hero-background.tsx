"use client"

import { useState } from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"

const HERO_VIDEO_SRC = "/videos/hero.mp4"
// Imagem em modo paisagem (fornecida pela cliente) — a anterior era
// vertical (foto de celular) e cortava boa parte do enquadramento numa
// tela larga de desktop via object-cover.
const HERO_POSTER = "/images/hero-bg.png"
const HERO_ALT = "Bebiano Imóveis"

// Mesmo tratamento cinematográfico (contraste, saturação, temperatura)
// aplicado nos dois formatos, pra trocar de imagem pra vídeo (ou vice
// versa) sem precisar redecidir o grading. object-position central (não
// mais deslocada pro topo) — a imagem paisagem já cobre bem o quadro sem
// precisar compensar recorte.
const MEDIA_FILTER =
  "object-cover object-center contrast-[1.1] saturate-[0.75] brightness-[0.9] sepia-[0.08] grayscale-[12%]"

export function HeroBackground() {
  // Antes o <Image> só aparecia depois do <video> falhar (sm:hidden
  // enquanto !videoFailed) — como public/videos/hero.mp4 não existe, no
  // desktop a tela ficava travada/em branco até o navegador desistir do
  // vídeo e disparar onError. Agora a imagem é sempre a base (visível
  // desde o primeiro frame) e o vídeo, quando existir de verdade, entra
  // por cima com um fade suave só depois de confirmar que consegue
  // tocar — nunca há um estado "travado" esperando o vídeo decidir se
  // existe.
  const [videoReady, setVideoReady] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)

  return (
    <div className="relative size-full">
      <Image
        src={HERO_POSTER}
        alt={HERO_ALT}
        fill
        priority
        sizes="100vw"
        className={MEDIA_FILTER}
      />

      {!videoFailed ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoFailed(true)}
          className={cn(
            "absolute inset-0 hidden size-full transition-opacity duration-700 sm:block",
            MEDIA_FILTER,
            videoReady ? "opacity-100" : "opacity-0"
          )}
        >
          <source src={HERO_VIDEO_SRC} type="video/mp4" />
        </video>
      ) : null}
    </div>
  )
}
