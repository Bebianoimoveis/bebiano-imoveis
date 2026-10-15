import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/motion/reveal"
import { siteConfig } from "@/config/site"
import { SectionBackdrop } from "@/components/public/section-backdrop"

// Foto de casal com a casinha da casa nova ao fundo — o convite final da
// página fecha com a mesma ideia de "chegar no lar".
export function AboutFinalCta() {
  return (
    <SectionBackdrop imageUrl="/images/about/final-cta.jpg" className="border-t border-border/60 text-primary-foreground">
      <Reveal className="relative mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-20 text-center sm:px-6 sm:py-24">
        <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Vamos encontrar o imóvel ideal para você?
        </h2>
        <p className="max-w-xl text-primary-foreground/80">
          Fale com os nossos especialistas, receba um atendimento
          personalizado, rápido, transparente e humanizado.
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="bg-gold text-black hover:bg-gold-light">
            <Link href="/imoveis">Ver imóveis</Link>
          </Button>
          {siteConfig.whatsapp ? (
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/5 text-white hover:bg-white/15 hover:text-white"
            >
              <a
                href={`https://wa.me/${siteConfig.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar pelo WhatsApp
              </a>
            </Button>
          ) : null}
        </div>
      </Reveal>
    </SectionBackdrop>
  )
}
