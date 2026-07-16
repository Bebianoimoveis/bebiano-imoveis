import Image from "next/image"
import Link from "next/link"
import { BedDouble, Car, ImageOff, ShowerHead } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/format"
import type { PropertyListItem } from "@/modules/property/repository"

const PURPOSE_LABEL: Record<string, string> = {
  SALE: "Venda",
  RENT: "Locação",
}

export function PropertyCard({ property }: { property: PropertyListItem }) {
  const cover = property.images.find((image) => image.isCover) ?? property.images[0]

  return (
    <Link
      href={`/imoveis/${property.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-4/3 bg-muted">
        {cover ? (
          <Image
            src={cover.url}
            alt={property.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-8" />
          </div>
        )}
        <Badge className="absolute left-3 top-3 border-transparent bg-primary text-primary-foreground">
          {PURPOSE_LABEL[property.purpose]}
        </Badge>
        {property.featured ? (
          <Badge className="absolute right-3 top-3 border-transparent bg-accent text-accent-foreground">
            Destaque
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="line-clamp-2 font-medium leading-snug">{property.title}</p>
        <p className="text-sm text-muted-foreground">
          {property.neighborhood.name}, {property.city.name}
        </p>

        <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
          {property.bedrooms > 0 ? (
            <span className="flex items-center gap-1">
              <BedDouble className="size-4" />
              {property.bedrooms}
            </span>
          ) : null}
          {property.bathrooms > 0 ? (
            <span className="flex items-center gap-1">
              <ShowerHead className="size-4" />
              {property.bathrooms}
            </span>
          ) : null}
          {property.parkingSpots > 0 ? (
            <span className="flex items-center gap-1">
              <Car className="size-4" />
              {property.parkingSpots}
            </span>
          ) : null}
        </div>

        <p className="mt-auto pt-2 font-heading text-lg font-semibold text-primary">
          {formatCurrency(property.price.toString())}
          {property.purpose === "RENT" ? (
            <span className="text-sm font-normal text-muted-foreground">/mês</span>
          ) : null}
        </p>
      </div>
    </Link>
  )
}
