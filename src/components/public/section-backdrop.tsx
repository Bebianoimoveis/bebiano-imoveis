import Image from "next/image"

import { ScrollParallax } from "@/components/motion/scroll-parallax"
import { cn } from "@/lib/utils"

// Foto de fundo de uma seção no mesmo estilo do Hero (foto escurecida +
// tom vinho da marca), pro texto continuar legível por cima. Overlay mais
// forte que o do Hero porque aqui tem parágrafos e cards inteiros por
// cima, não só um título. Sem filtro de cor nem mix-blend de propósito:
// os dois obrigavam o navegador a recompor a foto inteira a cada frame do
// parallax e o scroll engasgava em seções altas.
export function SectionBackdrop({
  imageUrl,
  mobilePositionClassName,
  parallax = true,
  className,
  children,
}: {
  imageUrl: string
  /** Enquadramento no celular, onde só aparece uma faixa vertical da foto
   * (ex: "object-[60%_50%] sm:object-center"). */
  mobilePositionClassName?: string
  /** Desligar em seções muito altas, onde mover a foto pesa no scroll. */
  parallax?: boolean
  className?: string
  children: React.ReactNode
}) {
  const image = (
    <Image
      src={imageUrl}
      alt=""
      fill
      sizes="100vw"
      className={cn("object-cover object-center", mobilePositionClassName)}
    />
  )

  return (
    <section className={cn("relative isolate overflow-hidden", className)}>
      {parallax ? (
        <ScrollParallax className="absolute inset-0 -z-30">{image}</ScrollParallax>
      ) : (
        <div className="absolute inset-0 -z-30">{image}</div>
      )}
      {/* Escurecimento mais leve no meio (onde fica a foto em destaque) e mais
          forte nas bordas (onde ficam títulos e o começo/fim da seção). A
          cliente pediu as fotos mais visíveis; os cards têm fundo próprio,
          então a leitura deles não depende desse escurecimento. */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-black/65 via-black/35 to-black/65 sm:from-black/70 sm:via-black/45 sm:to-black/70" />
      <div className="absolute inset-0 -z-10 bg-primary/15" />
      {children}
    </section>
  )
}
