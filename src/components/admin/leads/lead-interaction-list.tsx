import { Phone, MessageCircle, Mail, Home, StickyNote } from "lucide-react"

import type { LeadDetail } from "@/modules/lead/repository"

const TYPE_ICONS = {
  CALL: Phone,
  WHATSAPP: MessageCircle,
  EMAIL: Mail,
  VISIT: Home,
  NOTE: StickyNote,
} as const

const TYPE_LABELS: Record<string, string> = {
  CALL: "Ligação",
  WHATSAPP: "WhatsApp",
  EMAIL: "E-mail",
  VISIT: "Visita",
  NOTE: "Anotação",
}

export function LeadInteractionList({
  interactions,
}: {
  interactions: LeadDetail["interactions"]
}) {
  if (interactions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma interação registrada ainda.
      </p>
    )
  }

  return (
    <ul className="space-y-4">
      {interactions.map((interaction) => {
        const Icon = TYPE_ICONS[interaction.type]
        return (
          <li key={interaction.id} className="flex gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Icon className="size-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm">{interaction.description}</p>
              <p className="text-xs text-muted-foreground">
                {TYPE_LABELS[interaction.type]} · {interaction.user.name} ·{" "}
                {new Date(interaction.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
