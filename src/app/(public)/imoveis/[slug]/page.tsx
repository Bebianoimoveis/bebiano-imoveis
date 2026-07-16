import type { Metadata } from "next"
import { after } from "next/server"
import { notFound } from "next/navigation"
import { BedDouble, Car, Ruler, ShowerHead } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PropertyGallery } from "@/components/public/property-gallery"
import { PropertyCard } from "@/components/public/property-card"
import { PropertyContactForm } from "@/components/public/property-contact-form"
import { ShareButton } from "@/components/public/share-button"
import {
  getPublicPropertyBySlug,
  listSimilarProperties,
  trackPropertyView,
} from "@/modules/property/actions"
import { formatCurrency, getDisplayAddress } from "@/lib/format"

const PURPOSE_LABEL: Record<string, string> = {
  SALE: "Venda",
  RENT: "Locação",
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const property = await getPublicPropertyBySlug(slug)
  if (!property) return {}

  return {
    title: property.title,
    description: property.description.slice(0, 160),
    openGraph: {
      title: property.title,
      description: property.description.slice(0, 160),
      images: property.images[0] ? [property.images[0].url] : undefined,
    },
  }
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const property = await getPublicPropertyBySlug(slug)
  if (!property) notFound()

  // Roda depois da resposta ser enviada — não atrasa o carregamento da
  // página, e o Next garante que a execução termine mesmo em serverless.
  after(() => trackPropertyView(property.id))

  const similar = await listSimilarProperties({
    propertyId: property.id,
    cityId: property.cityId,
    typeId: property.typeId,
  })

  const whatsappHref = property.realtor
    ? `https://wa.me/${property.realtor.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Olá! Tenho interesse no imóvel ${property.code} - ${property.title}`
      )}`
    : null

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <PropertyGallery images={property.images} title={property.title} />

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-transparent bg-primary text-primary-foreground">
                {PURPOSE_LABEL[property.purpose]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Código {property.code}
              </span>
            </div>

            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              {property.title}
            </h1>
            <p className="text-muted-foreground">
              {getDisplayAddress(property)}
            </p>

            <div className="flex flex-wrap items-baseline gap-2">
              <p className="font-heading text-3xl font-semibold text-primary">
                {formatCurrency(property.price.toString())}
                {property.purpose === "RENT" ? (
                  <span className="text-base font-normal text-muted-foreground">
                    /mês
                  </span>
                ) : null}
              </p>
              {property.condoFee ? (
                <span className="text-sm text-muted-foreground">
                  + {formatCurrency(property.condoFee.toString())} condomínio
                </span>
              ) : null}
              {property.iptu ? (
                <span className="text-sm text-muted-foreground">
                  + {formatCurrency(property.iptu.toString())} IPTU
                </span>
              ) : null}
            </div>

            <ShareButton title={property.title} />
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-xl border border-border/60 p-5 sm:grid-cols-4">
            {property.bedrooms > 0 ? (
              <div className="flex flex-col items-center gap-1 text-center">
                <BedDouble className="size-5 text-primary" />
                <p className="text-sm font-medium">{property.bedrooms} quartos</p>
              </div>
            ) : null}
            {property.bathrooms > 0 ? (
              <div className="flex flex-col items-center gap-1 text-center">
                <ShowerHead className="size-5 text-primary" />
                <p className="text-sm font-medium">{property.bathrooms} banheiros</p>
              </div>
            ) : null}
            {property.parkingSpots > 0 ? (
              <div className="flex flex-col items-center gap-1 text-center">
                <Car className="size-5 text-primary" />
                <p className="text-sm font-medium">{property.parkingSpots} vagas</p>
              </div>
            ) : null}
            {property.builtArea ? (
              <div className="flex flex-col items-center gap-1 text-center">
                <Ruler className="size-5 text-primary" />
                <p className="text-sm font-medium">
                  {property.builtArea.toString()} m²
                </p>
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold">Descrição</h2>
            <p className="whitespace-pre-line text-muted-foreground">
              {property.description}
            </p>
          </div>

          {property.features.length > 0 ? (
            <div className="space-y-3">
              <h2 className="font-heading text-lg font-semibold">
                Características
              </h2>
              <div className="flex flex-wrap gap-2">
                {property.features.map((item) => (
                  <Badge key={item.featureId} variant="outline">
                    {item.feature.name}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="h-fit space-y-4 rounded-xl border border-border/60 p-5">
          {property.realtor ? (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Corretor responsável</p>
              <p className="font-medium">{property.realtor.user.name}</p>
              {property.realtor.creci ? (
                <p className="text-xs text-muted-foreground">
                  CRECI {property.realtor.creci}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Fale com a Bebiano Imóveis sobre este imóvel.
            </p>
          )}

          {whatsappHref ? (
            <Button asChild className="w-full">
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                Falar no WhatsApp
              </a>
            </Button>
          ) : null}

          <div className="border-t border-border/60 pt-4">
            <PropertyContactForm
              propertyId={property.id}
              propertyTitle={property.title}
            />
          </div>
        </aside>
      </div>

      {similar.length > 0 ? (
        <section className="mt-16 space-y-6">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Imóveis semelhantes
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((item) => (
              <PropertyCard key={item.id} property={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
