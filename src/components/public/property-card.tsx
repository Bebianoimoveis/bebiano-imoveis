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
      className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/60 transition-all duration-500 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/10 hover:ring-border"
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <Badge className="absolute left-3 top-3 border-0 bg-white/90 text-foreground shadow-sm backdrop-blur-sm">
          {PURPOSE_LABEL[property.purpose]}
        </Badge>
        {property.featured ? (
          <Badge className="absolute right-3 top-3 border-0 bg-gold text-accent-foreground shadow-sm">
            Destaque
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <p className="line-clamp-2 font-medium leading-snug transition-colors group-hover:text-primary">
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
        </div>

        <div className="mt-auto flex items-baseline justify-between border-t border-border/60 pt-3">
          <p className="font-heading text-xl font-semibold text-primary">
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
