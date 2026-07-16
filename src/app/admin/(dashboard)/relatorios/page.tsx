import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getLeadsOriginReport, getSalesReport } from "@/modules/report/actions"
import { formatCurrency } from "@/lib/format"

const MONTH_LABELS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

const ORIGIN_LABELS: Record<string, string> = {
  site: "Site",
  whatsapp: "WhatsApp",
  indicacao: "Indicação",
}

function formatMonth(key: string) {
  const [year, month] = key.split("-")
  return `${MONTH_LABELS[Number(month) - 1]} ${year}`
}

export default async function AdminReportsPage() {
  const [sales, leadsOrigin] = await Promise.all([
    getSalesReport(6),
    getLeadsOriginReport(),
  ])

  const totalLeads = leadsOrigin.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Relatórios
        </h1>
        <p className="text-sm text-muted-foreground">
          Vendas e origem dos leads nos últimos meses.
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Vendas por mês (últimos 6 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum contrato ativo ou concluído no período.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead>Contratos</TableHead>
                  <TableHead>Valor total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((row) => (
                  <TableRow key={row.month}>
                    <TableCell className="text-sm">{formatMonth(row.month)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.count}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatCurrency(row.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base font-medium">Leads por origem</CardTitle>
        </CardHeader>
        <CardContent>
          {leadsOrigin.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum lead registrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Origem</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>% do total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadsOrigin.map((item) => (
                  <TableRow key={item.origin}>
                    <TableCell className="text-sm">
                      {ORIGIN_LABELS[item.origin] ?? item.origin}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.count}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {totalLeads > 0 ? Math.round((item.count / totalLeads) * 100) : 0}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
