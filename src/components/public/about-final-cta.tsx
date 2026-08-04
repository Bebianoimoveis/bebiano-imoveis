import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/motion/reveal"
import { siteConfig } from "@/config/site"

// Mesmo tom marsala escuro (#4a0c1c) usado no CTA final da home — reservado
// para os pontos de maior ênfase da página, nunca como cor de base.
export function AboutFinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-border/60 bg-[#4a0c1c] text-primary-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_oklch,var(--color-gold)_12%,transparent),transparent_60%)]" />
      <Reveal className="relative mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-20 text-center sm:px-6 sm:py-24">
        <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Vamos encontrar o imóvel ideal para você?
        </h2>
        <p className="max-w-xl text-primary-foreground/80">
          Fale com nossos especialistas e receba um atendimento próximo,
          transparente e sem compromisso.
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="bg-gold text-accent-foreground hover:bg-gold-light">
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
    </section>
  )
}
