import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReportKpis } from "@/components/admin/reports/report-kpis"
import { ReportExportButton } from "@/components/admin/reports/report-export-button"
import { SalesByMonthChart } from "@/components/admin/reports/sales-by-month-chart"
import { LeadsByOriginChart } from "@/components/admin/reports/leads-by-origin-chart"
import { LeadsByStageChart } from "@/components/admin/reports/leads-by-stage-chart"
import { TopPropertiesPanel } from "@/components/admin/reports/top-properties-panel"
import { getBusinessReport } from "@/modules/report/actions"

const REPORT_MONTHS = 6

export default async function AdminReportsPage() {
  const report = await getBusinessReport(REPORT_MONTHS)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Inteligência de Negócios
          </h1>
          <p className="text-sm text-muted-foreground">
            Vendas, leads e portfólio dos últimos {REPORT_MONTHS} meses.
          </p>
        </div>
        <ReportExportButton months={REPORT_MONTHS} />
      </div>

      <ReportKpis
        salesThisMonth={report.salesThisMonth}
        newLeads={report.newLeads}
        conversionRate={report.conversionRate}
        propertyStatus={report.propertyStatus}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Vendas por mês (últimos {REPORT_MONTHS} meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SalesByMonthChart data={report.salesByMonth} />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base font-medium">Leads por origem</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadsByOriginChart data={report.leadsByOrigin} />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base font-medium">Funil de leads</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadsByStageChart data={report.leadsByStage} />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base font-medium">Imóveis mais visualizados</CardTitle>
          </CardHeader>
          <CardContent>
            <TopPropertiesPanel properties={report.topViewed} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
