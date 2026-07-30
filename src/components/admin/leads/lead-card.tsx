"use client"

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { Building2, Clock, MapPin, Star } from "lucide-react"

import { LeadAvatar } from "@/components/admin/leads/lead-avatar"
import { LeadOriginBadge } from "@/components/admin/leads/lead-origin-badge"
import { LeadTemperatureBadge } from "@/components/admin/leads/lead-temperature-badge"
import { PropertyRealtor } from "@/components/admin/properties/property-realtor"
import { formatCurrency, formatRelativeTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { LeadListItem } from "@/modules/lead/repository"

export function LeadCard({
  lead,
  onOpen,
}: {
  lead: LeadListItem
  onOpen: (leadId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => !isDragging && onOpen(lead.id)}
      className={cn(
        "cursor-grab space-y-2.5 rounded-[16px] border border-border/60 bg-card p-3.5 shadow-sm transition-shadow hover:border-primary/30 hover:shadow-lg hover:shadow-black/20 active:cursor-grabbing",
        isDragging && "z-10 opacity-50 shadow-2xl"
      )}
    >
      <div className="flex items-start gap-2.5">
        <LeadAvatar name={lead.name} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="truncate text-sm font-medium text-foreground">{lead.name}</p>
            {lead.vip ? <Star className="size-3.5 shrink-0 fill-gold text-gold" /> : null}
          </div>
          <p className="text-xs text-muted-foreground">{lead.phone}</p>
        </div>
      </div>

      {lead.property ? (
        <div className="space-y-1 rounded-xl bg-secondary/50 p-2 text-xs">
          <p className="flex items-center gap-1 truncate text-foreground">
            <Building2 className="size-3 shrink-0 text-muted-foreground" />
            {lead.property.title}
          </p>
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {lead.property.city?.name ?? "—"}
            </span>
            <span className="font-medium text-foreground">
              {formatCurrency(lead.property.price.toString())}
            </span>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-1.5">
        <LeadOriginBadge origin={lead.origin} />
        <LeadTemperatureBadge temperature={lead.temperature} />
      </div>

      {lead.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {lead.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex items-center justify-between border-t border-border/60 pt-2">
        {lead.realtor ? (
          <PropertyRealtor realtor={lead.realtor} />
        ) : (
          <span className="text-xs text-muted-foreground">Sem corretor</span>
        )}
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground" title="Tempo no estágio">
          <Clock className="size-3" />
          {formatRelativeTime(lead.stageChangedAt)}
        </span>
      </div>
    </div>
  )
}
