import type { ComponentType } from "react"
import { CheckCircle2, Eye, Mail, MessageCircle, Phone, Home as HomeIcon, Send, StickyNote, UserPlus } from "lucide-react"

import type { ProposalDetail } from "@/modules/proposal/repository"

type TimelineEvent = {
  id: string
  date: Date
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
}

const INTERACTION_ICONS = {
  CALL: Phone,
  WHATSAPP: MessageCircle,
  EMAIL: Mail,
  VISIT: HomeIcon,
  NOTE: StickyNote,
} as const

const INTERACTION_LABELS: Record<string, string> = {
  CALL: "Ligação",
  WHATSAPP: "WhatsApp",
  EMAIL: "E-mail",
  VISIT: "Visita",
  NOTE: "Anotação",
}

// Timeline montada a partir de eventos reais: criação (createdAt), envio
// (sentAt) e visualização (viewedAt, marcado de verdade pela página
// pública) + as interações registradas manualmente. Não inclui "valor
// alterado" — exigiria auditoria de campo que não existe.
export function ProposalTimeline({ proposal }: { proposal: ProposalDetail }) {
  const events: TimelineEvent[] = []

  events.push({
    id: `created-${proposal.id}`,
    date: proposal.createdAt,
    icon: UserPlus,
    title: "Proposta criada",
    description: `${proposal.client.name} · ${proposal.property.title}`,
  })

  if (proposal.sentAt) {
    events.push({
      id: `sent-${proposal.id}`,
      date: proposal.sentAt,
      icon: Send,
      title: "Proposta enviada",
      description: "Link compartilhado com o cliente",
    })
  }

  if (proposal.viewedAt) {
    events.push({
      id: `viewed-${proposal.id}`,
      date: proposal.viewedAt,
      icon: Eye,
      title: "Cliente visualizou",
      description: "Primeira abertura do link público",
    })
  }

  if (proposal.status === "COMPLETED") {
    events.push({
      id: `completed-${proposal.id}`,
      date: proposal.updatedAt,
      icon: CheckCircle2,
      title: "Negócio concluído",
      description: "Proposta concluída",
    })
  }

  for (const interaction of proposal.interactions) {
    events.push({
      id: `interaction-${interaction.id}`,
      date: interaction.createdAt,
      icon: INTERACTION_ICONS[interaction.type],
      title: INTERACTION_LABELS[interaction.type],
      description: interaction.description,
    })
  }

  events.sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <ul className="space-y-4">
      {events.map((event) => {
        const Icon = event.icon
        return (
          <li key={event.id} className="flex gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Icon className="size-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{event.title}</p>
              <p className="text-xs text-muted-foreground">{event.description}</p>
              <p className="text-xs text-muted-foreground">{new Date(event.date).toLocaleString("pt-BR")}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
