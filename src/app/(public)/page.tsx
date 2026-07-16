import Link from "next/link"
import { Building2, HandCoins, ShieldCheck, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { HeroSearch } from "@/components/public/hero-search"
import { PropertyCard } from "@/components/public/property-card"
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
      <section className="border-b border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl space-y-4">
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Encontre o imóvel certo em {siteConfig.city}
            </h1>
            <p className="text-muted-foreground">
              A {siteConfig.name} conecta você aos melhores imóveis para comprar
              ou alugar na região, com atendimento próximo e transparente.
            </p>
          </div>
          <div className="mt-8 max-w-3xl">
            <HeroSearch cities={cities} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Imóveis em destaque
          </h2>
          <Button variant="ghost" asChild>
            <Link href="/imoveis">Ver todos</Link>
          </Button>
        </div>

        {featured.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Nenhum imóvel em destaque no momento"
            description="Assim que um imóvel for marcado como destaque no painel, ele aparece aqui."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </section>

      {recent.length > 0 ? (
        <section className="border-t border-border/60 bg-secondary/20">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="mb-8 font-heading text-2xl font-semibold tracking-tight">
              Imóveis recentes
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {recent.slice(0, 4).map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="space-y-4">
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              Sobre a {siteConfig.name}
            </h2>
            <p className="text-muted-foreground">
              Somos uma imobiliária de {siteConfig.city}, {siteConfig.state},
              dedicada a tornar o processo de comprar, vender ou alugar um
              imóvel mais simples e confiável. Nossa equipe acompanha cada
              etapa da negociação com atenção aos detalhes que fazem diferença
              para você.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {DIFERENCIAIS.map((item) => (
              <div key={item.title} className="space-y-2">
                <item.icon className="size-6 text-primary" />
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Quer anunciar ou negociar um imóvel?
          </h2>
          <p className="max-w-xl text-primary-foreground/85">
            Fale com um de nossos corretores e receba uma avaliação sem
            compromisso.
          </p>
          {siteConfig.whatsapp ? (
            <Button
              asChild
              variant="secondary"
              className="bg-background text-foreground hover:bg-background/90"
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
        </div>
      </section>
    </div>
  )
}
