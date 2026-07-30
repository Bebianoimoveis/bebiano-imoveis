import { Users } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { formatCurrency } from "@/lib/format"
import type { getCommissionsByRealtor } from "@/modules/financial/repository"

type Commissions = Awaited<ReturnType<typeof getCommissionsByRealtor>>

export function FinancialCommissionsPanel({ commissions }: { commissions: Commissions }) {
  if (commissions.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum corretor ativo"
        description="As comissões por corretor aparecem aqui assim que houver corretores ativos com vendas."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {commissions.map((realtor) => (
        <div key={realtor.realtorId} className="space-y-3 rounded-[20px] border border-border/60 bg-card p-5">
          <p className="font-heading text-base font-semibold">{realtor.name}</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Valor vendido</span>
              <span className="font-medium">{formatCurrency(realtor.soldValue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Comissão paga</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {formatCurrency(realtor.commissionPaid)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Comissão pendente</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">
                {formatCurrency(realtor.commissionPending)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
