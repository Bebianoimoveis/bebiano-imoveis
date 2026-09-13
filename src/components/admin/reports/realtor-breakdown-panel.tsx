"use client"

import { useEffect, useState } from "react"
import { Users2 } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getNewLeadsAndClientsByRealtor } from "@/modules/report/actions"

type RealtorRow = { realtorId: string; realtorName: string; newLeads: number; newClients: number }

function currentMonthValue() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

// Bloco restrito (o próprio menu/permissão que renderiza isso já garante
// que só quem tem `user.manage` chega aqui — ver página de Relatórios)
// pra acompanhar quantos leads/clientes novos cada corretor trouxe num
// mês específico, sem misturar com os números agregados do resto da
// página.
export function RealtorBreakdownPanel() {
  const [month, setMonth] = useState(currentMonthValue())
  const [rows, setRows] = useState<RealtorRow[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const [year, monthNumber] = month.split("-").map(Number)
    if (!year || !monthNumber) return

    setLoading(true)
    getNewLeadsAndClientsByRealtor(monthNumber, year)
      .then(setRows)
      .finally(() => setLoading(false))
  }, [month])

  const totalLeads = rows?.reduce((sum, row) => sum + row.newLeads, 0) ?? 0
  const totalClients = rows?.reduce((sum, row) => sum + row.newClients, 0) ?? 0

  return (
    <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-semibold">Novos leads e clientes por corretor</h2>
          <p className="text-sm text-muted-foreground">Visível só para quem gerencia usuários.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="realtor-breakdown-month">Mês</Label>
          <Input
            id="realtor-breakdown-month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {loading || rows === null ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : rows.length === 0 ? (
        <EmptyState icon={Users2} title="Nenhum corretor ativo cadastrado" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs text-muted-foreground uppercase">
                <th className="py-2 pr-4 font-medium">Corretor</th>
                <th className="py-2 pr-4 font-medium">Novos leads</th>
                <th className="py-2 font-medium">Novos clientes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.realtorId} className="border-b border-border/40 last:border-0">
                  <td className="py-2 pr-4 font-medium">{row.realtorName}</td>
                  <td className="py-2 pr-4">{row.newLeads}</td>
                  <td className="py-2">{row.newClients}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border/60 font-semibold">
                <td className="py-2 pr-4">Total</td>
                <td className="py-2 pr-4">{totalLeads}</td>
                <td className="py-2">{totalClients}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
