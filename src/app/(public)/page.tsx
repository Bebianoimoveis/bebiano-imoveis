import Link from "next/link"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { Hero } from "@/components/public/hero"
import { AccentWord } from "@/components/public/accent-word"
import { PropertyCard } from "@/components/public/property-card"
import { CategoryBanners } from "@/components/public/category-banners"
import { LaunchesSection } from "@/components/public/launches-section"
import { TeamSection } from "@/components/public/team-section"
import { TestimonialsSection } from "@/components/public/testimonials-section"
import { Reveal } from "@/components/motion/reveal"
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group"
import { listFeaturedProperties } from "@/modules/property/actions"
import { listCities, listPublicPropertyTypes } from "@/modules/taxonomy/actions"
import { getPublicRentalEnabled, getPublicHeroImage } from "@/modules/settings/actions"
import { siteConfig } from "@/config/site"
import { Building2 } from "lucide-react"

export default async function HomePage() {
  const [featured, cities, propertyTypes, rentalEnabled, heroImageUrl] = await Promise.all([
    listFeaturedProperties(6),
    listCities(),
    listPublicPropertyTypes(),
    getPublicRentalEnabled(),
    getPublicHeroImage(),
  ])

  return (
    <div>
      {/* 1. Hero + busca premium */}
      <Hero cities={cities} propertyTypes={propertyTypes} rentalEnabled={rentalEnabled} heroImageUrl={heroImageUrl} />

      {/* Espaço extra no topo para acomodar a busca flutuante que "quebra"
          a borda inferior do Hero (ver Hero: -mb-12/-mb-16 no card de busca). */}
      <div className="pt-16 sm:pt-20 lg:pt-24" />

      {/* 2. Categorias */}
      <CategoryBanners />

      {/* 3. Lançamentos */}
      <LaunchesSection />

      {/* 4. Destaques / exclusivos */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal className="mb-8 flex items-center justify-between sm:mb-10">
          <div>
            <p className="text-sm font-medium tracking-widest text-gold-dark uppercase">
              Selecionados a dedo
            </p>
            <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
              Imóveis em <AccentWord>destaque</AccentWord>
            </h2>
          </div>
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/imoveis">Ver todos</Link>
          </Button>
        </Reveal>

        {featured.length === 0 ? (
          <Reveal>
            <EmptyState
              icon={Building2}
              title="Nenhum imóvel em destaque no momento"
              description="Assim que um imóvel for marcado como destaque no painel, ele aparece aqui."
            />
          </Reveal>
        ) : (
          <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((property) => (
              <StaggerItem key={property.id}>
                <PropertyCard property={property} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}

        <div className="mt-8 flex justify-center sm:hidden">
          <Button variant="outline" asChild>
            <Link href="/imoveis">Ver todos os imóveis</Link>
          </Button>
        </div>
      </section>

      {/* 5. Equipe */}
      <TeamSection />

      {/* 6. Depoimentos */}
      <TestimonialsSection />

      {/* 7. CTA */}
      {/* Marsala mais escuro que o --primary padrão (mesmo tom do header/
          barra mobile/WhatsApp) — a cor cheia ficava clara demais contra o
          resto do site, que é bem mais escuro. */}
      <section className="relative overflow-hidden border-t border-border/60 bg-[#4a0c1c] text-primary-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_oklch,var(--color-gold)_12%,transparent),transparent_60%)]" />
        <Reveal className="relative mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-20 text-center sm:px-6 sm:py-24">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Encontrou o imóvel ideal?
          </h2>
          <p className="max-w-xl text-primary-foreground/80">
            Fale com nossos especialistas e receba um atendimento próximo,
            transparente e sem compromisso.
          </p>
          {siteConfig.whatsapp ? (
            <Button
              asChild
              size="lg"
              className="mt-2 bg-gold text-accent-foreground hover:bg-gold-light"
            >
              <a
                href={`https://wa.me/${siteConfig.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar com um corretor
              </a>
            </Button>
          ) : null}
        </Reveal>
      </section>
    </div>
  )
}
