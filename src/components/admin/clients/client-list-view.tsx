"use client"

import { HelpCircle, Star } from "lucide-react"

import { WhatsAppIcon } from "@/components/shared/whatsapp-icon"
import { ClientAvatar } from "@/components/admin/clients/client-avatar"
import { ClientStatusBadge } from "@/components/admin/clients/client-status-badge"
import { ClientRowActions } from "@/components/admin/clients/client-row-actions"
import { PropertyRealtor } from "@/components/admin/properties/property-realtor"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatRelativeTime } from "@/lib/format"
import type { ClientListItem } from "@/modules/client/repository"

// A última coluna (ações) é de largura fixa (32px, igual ao botão "...")
// em vez de "auto" nos dois grids — com "auto" o cabeçalho (que não tem
// botão nenhum ali) e a linha (que tem) calculavam larguras diferentes
// pras colunas flexíveis (Cliente/Cidade), deixando o cabeçalho
// desalinhado com os dados a partir da coluna Cidade.
const HEADER_GRID_CLASS =
  "hidden lg:grid lg:grid-cols-[48px_minmax(0,1.6fr)_minmax(0,1fr)_120px_100px_100px_110px_32px] items-center gap-4 px-4 text-xs font-medium text-muted-foreground uppercase"
const ROW_GRID_CLASS =
  "group hidden items-center gap-4 rounded-[20px] border border-border/60 bg-card p-4 transition-colors hover:border-primary/30 hover:bg-secondary/20 cursor-pointer lg:grid lg:grid-cols-[48px_minmax(0,1.6fr)_minmax(0,1fr)_120px_100px_100px_110px_32px]"

function HeaderHint({ label, hint }: { label: string; hint: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">
            <HelpCircle className="size-3.5 normal-case text-muted-foreground/70" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-56 normal-case">{hint}</TooltipContent>
      </Tooltip>
    </span>
  )
}

function ClientWhatsappLink({ phone }: { phone: string }) {
  return (
    <a
      href={`https://wa.me/${phone.replace(/\D/g, "")}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="text-muted-foreground hover:text-emerald-500"
      aria-label="WhatsApp"
    >
      <WhatsAppIcon className="size-4" />
    </a>
  )
}

export function ClientListView({
  clients,
  onOpenClient,
}: {
  clients: ClientListItem[]
  onOpenClient: (id: string) => void
}) {
  return (
    <div className="space-y-3 lg:space-y-2">
      <div className={HEADER_GRID_CLASS}>
        <span />
        <span>Cliente</span>
        <span>Cidade</span>
        <span>Corretor</span>
        <HeaderHint
          label="Contatos"
          hint="Quantas vezes esse cliente demonstrou interesse (site, WhatsApp, indicação etc.), incluindo o contato que originou esse cadastro."
        />
        <HeaderHint
          label="Propostas"
          hint="Quantas propostas formais (imóvel + valor) já foram enviadas pra esse cliente."
        />
        <span>Última interação</span>
        <span />
      </div>

      {clients.map((client) => (
        <div key={client.id}>
          {/* Card compacto — só abaixo de lg a tabela vira colunas
              empilhadas sem legenda nenhuma, então aqui é um layout
              próprio pro mobile em vez de deixar a grade do desktop
              colapsar sozinha. */}
          <div
            className="flex flex-col gap-3 rounded-[20px] border border-border/60 bg-card p-4 transition-colors active:bg-secondary/20 lg:hidden"
            onClick={() => onOpenClient(client.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <ClientAvatar name={client.name} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-medium text-foreground">{client.name}</p>
                    {client.vip ? <Star className="size-3.5 shrink-0 fill-gold text-gold" /> : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {client.code} · {client.phone}
                  </p>
                </div>
              </div>
              <ClientStatusBadge status={client.status} />
            </div>

            <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              <span className="truncate">
                {client.city ? `${client.city.name} - ${client.city.state}` : "Cidade não informada"}
              </span>
              <ClientWhatsappLink phone={client.phone} />
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{client._count.leads} contato(s)</span>
              <span>{client._count.proposals} proposta(s)</span>
              <span className="ml-auto">{formatRelativeTime(client.lastInteractionAt)}</span>
            </div>

            <div
              className="flex items-center justify-between gap-2 border-t border-border/60 pt-3"
              onClick={(e) => e.stopPropagation()}
            >
              <PropertyRealtor realtor={client.realtor} />
              <ClientRowActions clientId={client.id} onOpen={() => onOpenClient(client.id)} />
            </div>
          </div>

          {/* Linha de tabela — só a partir de lg. */}
          <div className={ROW_GRID_CLASS} onClick={() => onOpenClient(client.id)}>
            <ClientAvatar name={client.name} />

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate font-medium text-foreground">{client.name}</p>
                {client.vip ? <Star className="size-3.5 shrink-0 fill-gold text-gold" /> : null}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {client.code} · {client.phone}
                {client.email ? ` · ${client.email}` : ""}
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {client.city ? `${client.city.name} - ${client.city.state}` : "—"}
              <ClientWhatsappLink phone={client.phone} />
            </div>

            <div>
              <PropertyRealtor realtor={client.realtor} />
            </div>

            <div className="text-sm text-muted-foreground">{client._count.leads}</div>

            <div className="text-sm text-muted-foreground">{client._count.proposals}</div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">
                {formatRelativeTime(client.lastInteractionAt)}
              </span>
              <ClientStatusBadge status={client.status} />
            </div>

            <div className="flex items-center justify-end">
              <ClientRowActions clientId={client.id} onOpen={() => onOpenClient(client.id)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
