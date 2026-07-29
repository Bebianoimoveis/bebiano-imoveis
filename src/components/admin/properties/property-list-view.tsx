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

// Classe completa e literal (não montada por interpolação) — o Tailwind
// só gera CSS pras classes que aparecem como texto exato no arquivo;
// `lg:${algumaVariavel}` nunca seria encontrado pelo scanner.
const HEADER_GRID_CLASS =
  "hidden lg:grid lg:grid-cols-[auto_88px_minmax(0,2fr)_120px_140px_minmax(0,1fr)_120px_auto] items-center gap-4 px-4 text-xs font-medium text-muted-foreground uppercase"
const ROW_GRID_CLASS =
  "group relative grid grid-cols-1 items-center gap-4 rounded-[20px] border border-border/60 bg-card p-4 transition-colors hover:border-primary/30 hover:bg-secondary/20 lg:grid-cols-[auto_88px_minmax(0,2fr)_120px_140px_minmax(0,1fr)_120px_auto]"

export function PropertyListView({
  properties,
  selectedIds,
  onToggle,
  onToggleAll,
}: {
  properties: PropertyWithMetrics[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  onToggleAll: () => void
}) {
  const allSelected = properties.length > 0 && properties.every((p) => selectedIds.has(p.id))

  return (
    <div className="space-y-2">
      <div className={HEADER_GRID_CLASS}>
        <Checkbox checked={allSelected} onCheckedChange={onToggleAll} aria-label="Selecionar todos" />
        <span />
        <span>Imóvel</span>
        <span>Valor</span>
        <span>Status</span>
        <span>Corretor</span>
        <span>Métricas</span>
        <span />
      </div>

      {properties.map((property) => {
        const cover = property.images.find((image) => image.isCover) ?? property.images[0]
        return (
          <div key={property.id} className={ROW_GRID_CLASS}>
            <Checkbox
              checked={selectedIds.has(property.id)}
              onCheckedChange={() => onToggle(property.id)}
              aria-label={`Selecionar ${property.title}`}
              className="absolute top-4 left-4 z-10 lg:static"
            />

            <div className="relative ml-7 size-16 shrink-0 overflow-hidden rounded-xl bg-secondary lg:ml-0">
              {cover ? (
                <NextImage
                  src={cover.url}
                  alt={property.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  sizes="64px"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <ImageOff className="size-5" />
                </div>
              )}
              {property.images.length > 0 ? (
                <span className="absolute right-0.5 bottom-0.5 rounded bg-black/70 px-1 text-[10px] font-medium text-white">
                  {property.images.length}
                </span>
              ) : null}
              {property.videoUrl ? (
                <span className="absolute top-0.5 left-0.5 flex size-4 items-center justify-center rounded-full bg-black/70 text-white">
                  <PlayCircle className="size-3" />
                </span>
              ) : null}
            </div>

            <div className="min-w-0 ml-7 lg:ml-0">
              <div className="mb-0.5 flex items-center gap-2">
                <span className="font-mono text-[11px] text-muted-foreground">{property.code}</span>
              </div>
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

            <div className="ml-7 text-sm font-medium text-foreground lg:ml-0">
              {formatCurrency(property.price.toString())}
            </div>

            <div className="ml-7 lg:ml-0">
              <PropertyStatusBadge status={property.status} />
            </div>

            <div className="ml-7 lg:ml-0">
              <PropertyRealtor realtor={property.realtor} />
            </div>

            <div className="ml-7 flex items-center gap-3 text-xs text-muted-foreground lg:ml-0">
              <span className="flex items-center gap-1" title="Visualizações">
                <Eye className="size-3.5" /> {property.viewCount}
              </span>
              <span className="flex items-center gap-1" title="Leads gerados">
                <MessagesSquare className="size-3.5" /> {property.leadCount}
              </span>
            </div>

            <div className="ml-7 flex items-center gap-1 lg:ml-0">
              <PropertyQuickActions
                propertyId={property.id}
                status={property.status}
                slug={property.slug}
                className="hidden items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 xl:flex"
              />
              <PropertyRowActions propertyId={property.id} status={property.status} slug={property.slug} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
