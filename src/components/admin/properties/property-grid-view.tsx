import Link from "next/link"
import NextImage from "next/image"
import { Eye, ImageOff, MessagesSquare, PlayCircle } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { PropertyStatusBadge } from "@/components/shared/status-badge"
import { PropertyRowActions } from "@/components/admin/properties/property-row-actions"
import { PropertyQuickActions } from "@/components/admin/properties/property-quick-actions"
import { PropertyRealtor } from "@/components/admin/properties/property-realtor"
import { formatCurrency } from "@/lib/format"
import type { PropertyWithMetrics } from "@/components/admin/properties/types"

export function PropertyGridView({
  properties,
  selectedIds,
  onToggle,
}: {
  properties: PropertyWithMetrics[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {properties.map((property) => {
        const cover = property.images.find((image) => image.isCover) ?? property.images[0]
        return (
          <div
            key={property.id}
            className="group overflow-hidden rounded-[20px] border border-border/60 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-black/20"
          >
            <div className="relative aspect-4/3 overflow-hidden bg-secondary">
              {cover ? (
                <NextImage
                  src={cover.url}
                  alt={property.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <ImageOff className="size-8" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              <Checkbox
                checked={selectedIds.has(property.id)}
                onCheckedChange={() => onToggle(property.id)}
                aria-label={`Selecionar ${property.title}`}
                className="absolute top-3 left-3 border-white/70 bg-black/30"
              />

              <div className="absolute top-3 right-3">
                <PropertyStatusBadge status={property.status} />
              </div>

              <div className="absolute right-3 bottom-3 flex items-center gap-1.5 text-[11px] font-medium text-white">
                {property.videoUrl ? (
                  <span className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5">
                    <PlayCircle className="size-3" /> Vídeo
                  </span>
                ) : null}
                {property.images.length > 0 ? (
                  <span className="rounded-full bg-black/60 px-2 py-0.5">{property.images.length} fotos</span>
                ) : null}
              </div>

              <p className="absolute bottom-3 left-3 font-heading text-lg font-semibold text-white">
                {formatCurrency(property.price.toString())}
              </p>

              <PropertyQuickActions
                propertyId={property.id}
                status={property.status}
                slug={property.slug}
                className="absolute inset-x-3 top-12 hidden items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 lg:flex"
              />
            </div>

            <div className="space-y-3 p-4">
              <div>
                <span className="font-mono text-[11px] text-muted-foreground">{property.code}</span>
                <Link
                  href={`/admin/imoveis/${property.id}`}
                  className="block truncate font-medium text-foreground hover:text-primary"
                >
                  {property.title}
                </Link>
                <p className="truncate text-xs text-muted-foreground">
                  {property.neighborhood.name}, {property.city.name}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-border/60 pt-3">
                <PropertyRealtor realtor={property.realtor} />
                <PropertyRowActions propertyId={property.id} status={property.status} slug={property.slug} />
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="size-3.5" /> {property.viewCount}
                </span>
                <span className="flex items-center gap-1">
                  <MessagesSquare className="size-3.5" /> {property.leadCount} leads
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
