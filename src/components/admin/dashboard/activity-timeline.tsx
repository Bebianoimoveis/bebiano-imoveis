import {
  Activity,
  Building2,
  CalendarDays,
  Contact,
  FileSignature,
  FileText,
  Settings,
  UserCog,
  Users2,
  Wallet,
  type LucideIcon,
} from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"

const RESOURCE_META: Record<string, { icon: LucideIcon; label: string }> = {
  property: { icon: Building2, label: "Imóvel" },
  lead: { icon: Users2, label: "Lead" },
  appointment: { icon: CalendarDays, label: "Agendamento" },
  proposal: { icon: FileText, label: "Proposta" },
  contract: { icon: FileSignature, label: "Contrato" },
  client: { icon: Contact, label: "Cliente" },
  user: { icon: UserCog, label: "Usuário" },
  financial: { icon: Wallet, label: "Financeiro" },
  settings: { icon: Settings, label: "Configurações" },
}

function describeActivity(action: string) {
  const [resource, ...rest] = action.split(".")
  const meta = RESOURCE_META[resource] ?? { icon: Activity, label: resource }
  const detail = rest.join(" ").replace(/_/g, " ")
  return { icon: meta.icon, text: detail ? `${meta.label} · ${detail}` : meta.label }
}

type ActivityItem = {
  id: string
  action: string
  createdAt: Date
  user: { name: string }
}

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return <EmptyState icon={Activity} title="Nenhuma atividade registrada ainda" />
  }

  return (
    <ol className="relative space-y-5 pl-1">
      {items.map((item, index) => {
        const { icon: Icon, text } = describeActivity(item.action)
        return (
          <li key={item.id} className="relative flex gap-3">
            <div className="flex flex-col items-center">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <Icon className="size-3.5" />
              </span>
              {index < items.length - 1 ? (
                <span className="mt-1 w-px flex-1 bg-border" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <p className="text-sm text-foreground">
                <span className="font-medium">{item.user.name}</span>{" "}
                <span className="text-muted-foreground">{text}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
