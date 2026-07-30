"use client"

import { Star } from "lucide-react"

import { ClientAvatar } from "@/components/admin/clients/client-avatar"
import { ClientStatusBadge } from "@/components/admin/clients/client-status-badge"
import { ClientTypeBadge } from "@/components/admin/clients/client-type-badge"
import { LeadOriginBadge } from "@/components/admin/leads/lead-origin-badge"
import { PropertyRealtor } from "@/components/admin/properties/property-realtor"
import type { ClientListItem } from "@/modules/client/repository"

export function ClientCardsView({
  clients,
  onOpenClient,
}: {
  clients: ClientListItem[]
  onOpenClient: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {clients.map((client) => (
        <button
          key={client.id}
          type="button"
          onClick={() => onOpenClient(client.id)}
          className="group flex flex-col gap-3 rounded-[20px] border border-border/60 bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <ClientAvatar name={client.name} size="lg" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-heading font-semibold text-foreground">{client.name}</p>
                  {client.vip ? <Star className="size-3.5 shrink-0 fill-gold text-gold" /> : null}
                </div>
                <p className="truncate text-xs text-muted-foreground">{client.code}</p>
              </div>
            </div>
            <ClientStatusBadge status={client.status} />
          </div>

          <div className="space-y-1 text-sm text-muted-foreground">
            <p>{client.phone}</p>
            <p>{client.city ? `${client.city.name} - ${client.city.state}` : "Cidade não informada"}</p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {client.origin ? <LeadOriginBadge origin={client.origin} /> : null}
            {client.types.map((type) => (
              <ClientTypeBadge key={type} type={type} />
            ))}
          </div>

          <div className="mt-auto border-t border-border/60 pt-3">
            <PropertyRealtor realtor={client.realtor} />
          </div>
        </button>
      ))}
    </div>
  )
}
