import Image from "next/image"

import { ScrollParallax } from "@/components/motion/scroll-parallax"
import { cn } from "@/lib/utils"

// Foto de fundo de uma seção da "/sobre" no mesmo estilo do Hero (foto
// escurecida em camadas + tom vinho da marca), pro texto continuar
// legível por cima. Overlay mais forte que o do Hero porque aqui tem
// parágrafos e cards inteiros por cima, não só um título. A foto anda
// mais devagar que o scroll (parallax).
export function SectionBackdrop({
  imageUrl,
  mobilePositionClassName,
  className,
  children,
}: {
  imageUrl: string
  /** Enquadramento no celular, onde só aparece uma faixa vertical da foto
   * (ex: "object-[60%_50%] sm:object-center"). */
  mobilePositionClassName?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("relative isolate overflow-hidden", className)}>
      <ScrollParallax className="absolute inset-0 -z-30">
        <Image src={imageUrl} alt="" fill sizes="100vw" className={cn("object-cover object-center saturate-[0.8]", mobilePositionClassName)} />
      </ScrollParallax>
      {/* Mais leve no celular: lá os cards (com fundo próprio) cobrem quase a
          seção toda e, com o escurecimento cheio, a foto praticamente sumia. */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-black/75 via-black/50 to-black/75 sm:from-black/85 sm:via-black/70 sm:to-black/85" />
      <div className="absolute inset-0 -z-10 bg-primary/30 mix-blend-multiply" />
      {children}
    </section>
  )
}
