import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { Activity } from "lucide-react"
import { getDashboardMetrics } from "@/modules/report/actions"
import { formatCurrency } from "@/lib/format"

const ORIGIN_LABELS: Record<string, string> = {
  site: "Site",
  whatsapp: "WhatsApp",
  indicacao: "Indicação",
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Visão geral da operação da Bebiano Imóveis.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Imóveis publicados" value={String(metrics.propertyStatus.published)} />
        <StatCard label="Vendidos" value={String(metrics.propertyStatus.sold)} />
        <StatCard label="Alugados" value={String(metrics.propertyStatus.rented)} />
        <StatCard label="Indisponíveis" value={String(metrics.propertyStatus.unavailable)} />
        <StatCard label="Novos leads (30 dias)" value={String(metrics.newLeads)} />
        <StatCard label="Visitas agendadas" value={String(metrics.upcomingAppointments)} />
        <StatCard label="Propostas abertas" value={String(metrics.openProposals)} />
        <StatCard
          label="Vendas no mês"
          value={formatCurrency(metrics.salesInPeriod.total.toString())}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base font-medium">Leads por origem</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.leadsByOrigin.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum lead ainda.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {metrics.leadsByOrigin.map((item) => (
                  <li key={item.origin} className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {ORIGIN_LABELS[item.origin] ?? item.origin}
                    </span>
                    <span className="font-medium">{item.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Imóveis mais visualizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.topViewed.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma visualização registrada ainda.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {metrics.topViewed.map((property) => (
                  <li key={property.id} className="flex items-center justify-between gap-4">
                    <span className="truncate text-muted-foreground">
                      {property.code} · {property.title}
                    </span>
                    <span className="shrink-0 font-medium">{property.viewCount}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base font-medium">Atividades recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.activity.length === 0 ? (
            <EmptyState icon={Activity} title="Nenhuma atividade registrada ainda" />
          ) : (
            <ul className="space-y-3 text-sm">
              {metrics.activity.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4">
                  <span>
                    <span className="font-medium">{item.user.name}</span>{" "}
                    <span className="text-muted-foreground">{item.action}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
