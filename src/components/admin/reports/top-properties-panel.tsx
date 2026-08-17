import Image from "next/image"
import Link from "next/link"
import { Eye, ImageOff } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"

type TopProperty = {
  id: string
  code: string
  title: string
  viewCount: number
  images: { url: string }[]
}

export function TopPropertiesPanel({ properties }: { properties: TopProperty[] }) {
  if (properties.length === 0) {
    return (
      <EmptyState
        icon={Eye}
        title="Nenhum imóvel publicado"
        description="Os mais visualizados aparecem aqui assim que houver imóveis publicados."
      />
    )
  }

  return (
    <ul className="divide-y divide-border/60">
      {properties.map((property, index) => (
        <li key={property.id}>
          <Link
            href={`/admin/imoveis/${property.id}`}
            className="flex items-center gap-3 py-2.5 transition-colors hover:text-primary"
          >
            <span className="w-4 shrink-0 text-xs font-medium text-muted-foreground">{index + 1}</span>
            <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-secondary">
              {property.images[0] ? (
                <Image src={property.images[0].url} alt="" fill className="object-cover" sizes="40px" />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <ImageOff className="size-4" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{property.title}</p>
              <p className="text-xs text-muted-foreground">{property.code}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
              <Eye className="size-3.5" />
              {property.viewCount}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
