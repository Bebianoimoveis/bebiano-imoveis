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
  className,
  children,
}: {
  imageUrl: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("relative isolate overflow-hidden", className)}>
      <ScrollParallax className="absolute inset-0 -z-30">
        <Image src={imageUrl} alt="" fill sizes="100vw" className="object-cover object-center saturate-[0.8]" />
      </ScrollParallax>
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-black/85 via-black/70 to-black/85" />
      <div className="absolute inset-0 -z-10 bg-primary/30 mix-blend-multiply" />
      {children}
    </section>
  )
}
