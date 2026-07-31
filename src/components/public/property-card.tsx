import Image from "next/image"
import Link from "next/link"
import { BedDouble, Building2, Car, ImageOff, ShowerHead } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { FavoriteButton } from "@/components/public/favorite-button"
import { CardShareButton } from "@/components/public/card-share-button"
import { formatCurrency } from "@/lib/format"
import type { PropertyListItem } from "@/modules/property/repository"

const PURPOSE_LABEL: Record<string, string> = {
  SALE: "Venda",
  RENT: "Locação",
}

const NEW_THRESHOLD_DAYS = 21

function isRecent(property: PropertyListItem) {
  const referenceDate = property.publishedAt ?? property.createdAt
  if (!referenceDate) return false
  const days = (Date.now() - new Date(referenceDate).getTime()) / (1000 * 60 * 60 * 24)
  return days <= NEW_THRESHOLD_DAYS
}

export function PropertyCard({ property }: { property: PropertyListItem }) {
  const cover = property.images.find((image) => image.isCover) ?? property.images[0]
  const showNew = isRecent(property)

  return (
    <Link
      href={`/imoveis/${property.slug}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/60 transition-all duration-500 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/30 hover:ring-gold/30"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-muted">
        {cover ? (
          <Image
            src={cover.url}
            alt={property.title}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          <Badge className="border-0 bg-black/45 text-white shadow-sm backdrop-blur-md">
            {PURPOSE_LABEL[property.purpose]}
          </Badge>
          {property.featured ? (
            <Badge className="border-0 bg-gold text-accent-foreground shadow-sm">
              Exclusivo
            </Badge>
          ) : null}
          {showNew ? (
            <Badge className="border-0 bg-primary text-primary-foreground shadow-sm">
              Novo
            </Badge>
          ) : null}
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <CardShareButton title={property.title} path={`/imoveis/${property.slug}`} />
          <FavoriteButton propertyId={property.id} />
        </div>
        <p className="absolute bottom-3 left-4 font-heading text-lg font-semibold text-white sm:hidden">
          {formatCurrency(property.price.toString())}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <p className="line-clamp-2 font-medium leading-snug transition-colors group-hover:text-gold-light">
          {property.title}
        </p>
        <p className="text-sm text-muted-foreground">
          {property.neighborhood.name}, {property.city.name}
        </p>

        <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
          {property.bedrooms > 0 ? (
            <span className="flex items-center gap-1.5">
              <BedDouble className="size-4 shrink-0" strokeWidth={1.5} />
              {property.bedrooms}
            </span>
          ) : null}
          {property.bathrooms > 0 ? (
            <span className="flex items-center gap-1.5">
              <ShowerHead className="size-4 shrink-0" strokeWidth={1.5} />
              {property.bathrooms}
            </span>
          ) : null}
          {property.parkingSpots > 0 ? (
            <span className="flex items-center gap-1.5">
              <Car className="size-4 shrink-0" strokeWidth={1.5} />
              {property.parkingSpots}
            </span>
          ) : null}
          {property.availableUnits ? (
            <span className="flex items-center gap-1.5">
              <Building2 className="size-4 shrink-0" strokeWidth={1.5} />
              {property.availableUnits} unidades
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex items-baseline justify-between border-t border-border/60 pt-3">
          <p className="font-heading text-xl font-semibold text-foreground">
            {formatCurrency(property.price.toString())}
            {property.purpose === "RENT" ? (
              <span className="text-sm font-normal text-muted-foreground">/mês</span>
            ) : null}
          </p>
        </div>
      </div>
    </Link>
  )
}
