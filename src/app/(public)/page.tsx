import Link from "next/link"
import { Building2, HandCoins, ShieldCheck, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { Hero } from "@/components/public/hero"
import { PropertyCard } from "@/components/public/property-card"
import { Reveal } from "@/components/motion/reveal"
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group"
import {
  listFeaturedProperties,
  listRecentProperties,
} from "@/modules/property/actions"
import { listCities } from "@/modules/taxonomy/actions"
import { siteConfig } from "@/config/site"

const DIFERENCIAIS = [
  {
    icon: Building2,
    title: "Imóveis selecionados",
    description: "Catálogo curado em Mogi das Cruzes e região, sempre atualizado.",
  },
  {
    icon: Users,
    title: "Atendimento próximo",
    description: "Corretores dedicados que acompanham você do início ao fim.",
  },
  {
    icon: ShieldCheck,
    title: "Negociação segura",
    description: "Documentação e propostas conduzidas com transparência.",
  },
  {
    icon: HandCoins,
    title: "Condições facilitadas",
    description: "Apoio na análise de financiamento e uso do FGTS.",
  },
]

export default async function HomePage() {
  const [featured, recent, cities] = await Promise.all([
    listFeaturedProperties(6),
    listRecentProperties(8),
    listCities(),
  ])

  return (
    <div>
      <Hero cities={cities} />

      {/* Espaço extra no topo para acomodar a busca flutuante que "quebra"
          a borda inferior do Hero (ver Hero: -mb-24 no card de busca). */}
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-16 sm:px-6 sm:pt-16">
        <Reveal className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium tracking-widest text-gold-dark uppercase">
              Selecionados a dedo
            </p>
            <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
              Imóveis em destaque
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
      </section>

      {recent.length > 0 ? (
        <section className="border-t border-border/60 bg-secondary/30">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <Reveal>
              <h2 className="font-heading mb-10 text-3xl font-semibold tracking-tight">
                Imóveis recentes
              </h2>
            </Reveal>
            <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {recent.slice(0, 4).map((property) => (
                <StaggerItem key={property.id}>
                  <PropertyCard property={property} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="grid gap-12 md:grid-cols-2 md:items-center md:gap-16">
          <Reveal>
            <p className="text-sm font-medium tracking-widest text-gold-dark uppercase">
              Quem somos
            </p>
            <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight text-balance">
              Sobre a {siteConfig.name}
            </h2>
            <p className="mt-4 text-muted-foreground">
              Somos uma imobiliária de {siteConfig.city}, {siteConfig.state},
              dedicada a tornar o processo de comprar ou vender um imóvel
              novo ou usado mais simples e confiável. Nossa equipe acompanha
              cada etapa da negociação com atenção aos detalhes que fazem
              diferença para você.
            </p>
          </Reveal>
          <StaggerGroup className="grid gap-8 sm:grid-cols-2">
            {DIFERENCIAIS.map((item) => (
              <StaggerItem key={item.title} className="space-y-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-primary/8">
                  <item.icon className="size-5 text-primary" />
                </div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-border/60 bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_oklch,var(--color-gold)_12%,transparent),transparent_60%)]" />
        <Reveal className="relative mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-24 text-center sm:px-6">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Quer anunciar ou negociar um imóvel?
          </h2>
          <p className="max-w-xl text-primary-foreground/80">
            Fale com um de nossos corretores e receba uma avaliação sem
            compromisso.
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
