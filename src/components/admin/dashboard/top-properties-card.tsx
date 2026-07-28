import Image from "next/image"
import Link from "next/link"
import { Building2, ImageOff } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"

type TopProperty = {
  id: string
  code: string
  title: string
  viewCount: number
  images: { url: string }[]
}

export function TopPropertiesCard({ properties }: { properties: TopProperty[] }) {
  if (properties.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="Nenhuma visualização registrada ainda"
        description="Os imóveis mais vistos no site aparecem aqui."
      />
    )
  }

  return (
    <div className="space-y-1">
      {properties.map((property) => (
        <Link
          key={property.id}
          href={`/admin/imoveis/${property.id}`}
          className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-secondary/60"
        >
          <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
            {property.images[0] ? (
              <Image
                src={property.images[0].url}
                alt={property.title}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <ImageOff className="size-4" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{property.title}</p>
            <p className="text-xs text-muted-foreground">{property.code}</p>
          </div>
          <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
            {property.viewCount} views
          </span>
        </Link>
      ))}
    </div>
  )
}
