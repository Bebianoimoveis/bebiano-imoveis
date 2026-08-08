import Link from "next/link"
import {
  Bell,
  Cake,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Wallet,
} from "lucide-react"

import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { getDashboardSidePanel } from "@/modules/report/actions"

type SidePanelData = Awaited<ReturnType<typeof getDashboardSidePanel>>

function Section({
  icon: Icon,
  title,
  count,
  href,
  children,
}: {
  icon: React.ElementType
  title: string
  count?: number
  href: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3 border-b border-border/60 px-5 py-4 last:border-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="size-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</p>
        </div>
        {count !== undefined && count > 0 ? (
          <span className="flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
            {count}
          </span>
        ) : null}
      </div>
      {children}
      <Link href={href} className="block text-xs font-medium text-gold hover:underline">
        Ver tudo
      </Link>
    </div>
  )
}

function EmptyRow({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <CheckCircle2 className="size-3.5 text-emerald-500" /> {label}
    </p>
  )
}

export function DashboardSidePanel({ data }: { data: SidePanelData }) {
  const { todayAppointments, birthdays, expiringProposals, financialAlerts, alerts } = data

  return (
    <aside className="h-fit rounded-[20px] border border-border/60 bg-card shadow-sm">
      <Section icon={Bell} title="Alertas" count={alerts.length} href="/admin/relatorios">
        {alerts.length === 0 ? (
          <EmptyRow label="Tudo em ordem" />
        ) : (
          <ul className="space-y-1.5">
            {alerts.map((alert) => (
              <li key={alert.id}>
                <Link
                  href={alert.href}
                  className="flex items-start gap-1.5 text-sm text-foreground hover:text-gold"
                >
                  <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
                  {alert.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section icon={CalendarDays} title="Agenda de hoje" href="/admin/agenda">
        {todayAppointments.length === 0 ? (
          <EmptyRow label="Agenda livre hoje" />
        ) : (
          <ul className="space-y-2">
            {todayAppointments.slice(0, 4).map((appointment) => (
              <li key={appointment.id} className="text-sm">
                <p className="font-medium text-foreground">
                  {new Date(appointment.scheduledAt).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · {appointment.lead?.name ?? appointment.client?.name ?? "Compromisso"}
                </p>
                <p className="truncate text-xs text-muted-foreground">{appointment.realtor.user.name}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section icon={CircleAlert} title="Radar de prazos" href="/admin/propostas">
        {expiringProposals.length === 0 ? (
          <EmptyRow label="Sem prazos críticos" />
        ) : (
          <ul className="space-y-2">
            {expiringProposals.slice(0, 4).map((proposal) => {
              const daysUntil = proposal.validUntil
                ? Math.ceil((new Date(proposal.validUntil).getTime() - Date.now()) / 86400000)
                : null
              return (
                <li key={proposal.id} className="text-sm">
                  <p className="truncate font-medium text-foreground">{proposal.client.name}</p>
                  <p
                    className={cn(
                      "text-xs",
                      daysUntil !== null && daysUntil <= 2 ? "text-destructive" : "text-muted-foreground"
                    )}
                  >
                    {daysUntil === 0 ? "Vence hoje" : `Vence em ${daysUntil} dia${daysUntil === 1 ? "" : "s"}`}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </Section>

      <Section icon={Cake} title="Aniversários (7 dias)" href="/admin/clientes">
        {birthdays.length === 0 ? (
          <EmptyRow label="Nenhum" />
        ) : (
          <ul className="space-y-2">
            {birthdays.slice(0, 4).map((client) => (
              <li key={client.id} className="flex items-center justify-between text-sm">
                <span className="truncate font-medium text-foreground">{client.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {client.daysUntil === 0 ? "Hoje!" : `em ${client.daysUntil}d`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {financialAlerts ? (
        <Section icon={Wallet} title="Vencimentos hoje" href="/admin/financeiro">
          {financialAlerts.dueToday.length === 0 ? (
            <EmptyRow label="Nenhum vencimento" />
          ) : (
            <ul className="space-y-2">
              {financialAlerts.dueToday.slice(0, 4).map((entry) => (
                <li key={entry.id} className="flex items-center justify-between text-sm">
                  <span className="truncate font-medium text-foreground">{entry.category}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatCurrency(entry.amount.toString())}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      ) : null}
    </aside>
  )
}
