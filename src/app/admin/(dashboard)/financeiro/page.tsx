import { Plus, Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/shared/empty-state"
import { FinancialEntryFormDialog } from "@/components/admin/financial/financial-entry-form-dialog"
import { MarkPaidButton } from "@/components/admin/financial/mark-paid-button"
import { listAdminFinancialEntries } from "@/modules/financial/actions"
import { listAdminContracts } from "@/modules/contract/actions"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"

export default async function AdminFinancialPage() {
  const [entries, contracts] = await Promise.all([
    listAdminFinancialEntries({}),
    listAdminContracts(),
  ])

  const income = entries
    .filter((e) => e.type === "INCOME")
    .reduce((sum, e) => sum + Number(e.amount), 0)
  const expense = entries
    .filter((e) => e.type === "EXPENSE")
    .reduce((sum, e) => sum + Number(e.amount), 0)
  const balance = income - expense

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Financeiro
          </h1>
          <p className="text-sm text-muted-foreground">
            Receitas e despesas da imobiliária.
          </p>
        </div>
        <FinancialEntryFormDialog
          contracts={contracts}
          trigger={
            <Button>
              <Plus className="size-4" />
              Novo lançamento
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-semibold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(income)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-semibold text-destructive">
              {formatCurrency(expense)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Saldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "font-heading text-2xl font-semibold",
                balance >= 0 ? "text-primary" : "text-destructive"
              )}
            >
              {formatCurrency(balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Nenhum lançamento registrado"
          description="Lançamentos de comissões, despesas e outras movimentações aparecem aqui."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-sm">{entry.category}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "border-transparent",
                        entry.type === "INCOME"
                          ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
                          : "bg-destructive/10 text-destructive"
                      )}
                    >
                      {entry.type === "INCOME" ? "Receita" : "Despesa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entry.contract
                      ? `${entry.contract.property.code} · ${entry.contract.client.name}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatCurrency(entry.amount.toString())}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(entry.dueDate).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    {entry.paidAt ? (
                      <Badge
                        variant="outline"
                        className="border-transparent bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
                      >
                        Pago
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-transparent bg-muted text-muted-foreground">
                        Em aberto
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {!entry.paidAt ? <MarkPaidButton entryId={entry.id} /> : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
