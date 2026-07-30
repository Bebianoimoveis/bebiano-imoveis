import type { ComponentType } from "react"
import {
  CalendarCheck,
  FileSignature,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  Home as HomeIcon,
  StickyNote,
  UserPlus,
  Users2,
} from "lucide-react"

import { formatCurrency } from "@/lib/format"
import { LEAD_STAGE_LABELS } from "@/components/admin/leads/lead-stage"
import type { ClientDetail } from "@/modules/client/repository"

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

// Junta as ClientInteraction (registradas direto) com eventos derivados
// de leads/propostas/contratos/agendamentos — não existe um "log de
// eventos" único no banco, então a timeline é montada aqui a partir das
// tabelas que já carregam data/hora de verdade.
export function ClientTimeline({ client }: { client: ClientDetail }) {
  const events: TimelineEvent[] = []

  events.push({
    id: `created-${client.id}`,
    date: client.createdAt,
    icon: UserPlus,
    title: "Cliente cadastrado",
    description: `Código ${client.code}`,
  })

  for (const lead of client.leads) {
    events.push({
      id: `lead-${lead.id}`,
      date: lead.createdAt,
      icon: Users2,
      title: "Lead criado",
      description: `Etapa: ${LEAD_STAGE_LABELS[lead.stage]}`,
    })
  }

  for (const appointment of client.appointments) {
    events.push({
      id: `appointment-${appointment.id}`,
      date: appointment.scheduledAt,
      icon: CalendarCheck,
      title: "Visita agendada",
      description: new Date(appointment.scheduledAt).toLocaleString("pt-BR"),
    })
  }

  for (const proposal of client.proposals) {
    events.push({
      id: `proposal-${proposal.id}`,
      date: proposal.createdAt,
      icon: FileText,
      title: "Proposta registrada",
      description: formatCurrency(proposal.value.toString()),
    })
  }

  for (const contract of client.contracts) {
    events.push({
      id: `contract-${contract.id}`,
      date: contract.createdAt,
      icon: FileSignature,
      title: "Contrato criado",
      description: formatCurrency(contract.value.toString()),
    })
  }

  for (const interaction of client.interactions) {
    events.push({
      id: `interaction-${interaction.id}`,
      date: interaction.createdAt,
      icon: INTERACTION_ICONS[interaction.type],
      title: INTERACTION_LABELS[interaction.type],
      description: interaction.description,
    })
  }

  events.sort((a, b) => b.date.getTime() - a.date.getTime())

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum evento ainda.</p>
  }

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
              <p className="text-xs text-muted-foreground">
                {new Date(event.date).toLocaleString("pt-BR")}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
