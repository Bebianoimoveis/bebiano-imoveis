"use client"

import { useState } from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"

const HERO_VIDEO_SRC = "/videos/hero.mp4"
const HERO_POSTER = "/images/hero-team.jpg"

// Mesmo tratamento cinematográfico (contraste, saturação, temperatura)
// aplicado nos dois formatos, pra trocar de imagem pra vídeo (ou vice
// versa) sem precisar redecidir o grading.
const MEDIA_FILTER =
  "object-cover object-[50%_10%] contrast-[1.1] saturate-[0.75] brightness-[0.9] sepia-[0.08] grayscale-[12%]"

export function HeroBackground() {
  const [videoFailed, setVideoFailed] = useState(false)

  return (
    <div className="relative size-full">
      {/* Vídeo só em telas sm+: em mobile priorizamos performance/dados do
          usuário e mantemos a imagem estática. Enquanto
          public/videos/hero.mp4 não existir, o próprio <video> dispara
          onError e cai pra imagem automaticamente — não precisa remover
          nada daqui quando o arquivo for adicionado depois. */}
      {!videoFailed ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={HERO_POSTER}
          onError={() => setVideoFailed(true)}
          className={cn("absolute inset-0 hidden size-full sm:block", MEDIA_FILTER)}
        >
          <source src={HERO_VIDEO_SRC} type="video/mp4" />
        </video>
      ) : null}

      <Image
        src={HERO_POSTER}
        alt="Equipe Bebiano Imóveis"
        fill
        priority
        sizes="100vw"
        className={cn(MEDIA_FILTER, !videoFailed && "sm:hidden")}
      />
    </div>
  )
}
