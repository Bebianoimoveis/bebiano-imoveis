"use client"

import { useState } from "react"
import { ArrowRight, Banknote, FileText, TrendingUp, Wallet } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { FinancialEntryFormSheet } from "@/components/admin/financial/financial-entry-form-sheet"

type ClientOption = { id: string; name: string }
type RealtorOption = { id: string; user: { name: string } }
type PropertyOption = { id: string; code: string; title: string }

const FLOW_STEPS = [
  { icon: Banknote, label: "Receita/Despesa" },
  { icon: FileText, label: "Lançamento" },
  { icon: Wallet, label: "Recebimento/Pagamento" },
  { icon: TrendingUp, label: "Fluxo de Caixa" },
]

export function FinancialEmptyState({
  clients,
  realtors,
  properties,
}: {
  clients: ClientOption[]
  realtors: RealtorOption[]
  properties: PropertyOption[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-8">
      <EmptyState
        icon={Wallet}
        title="Nenhum lançamento registrado"
        description="Crie o primeiro lançamento e acompanhe receitas, despesas e fluxo de caixa em um só lugar."
        action={<Button onClick={() => setOpen(true)}>Criar primeiro lançamento</Button>}
      />

      <div className="flex flex-wrap items-center justify-center gap-3 rounded-[20px] border border-border/60 bg-card p-6">
        {FLOW_STEPS.map((step, index) => (
          <div key={step.label} className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-2">
              <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <step.icon className="size-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{step.label}</span>
            </div>
            {index < FLOW_STEPS.length - 1 ? <ArrowRight className="size-4 shrink-0 text-muted-foreground/50" /> : null}
          </div>
        ))}
      </div>

      <FinancialEntryFormSheet
        open={open}
        onOpenChange={setOpen}
        defaultType="INCOME"
        clients={clients}
        realtors={realtors}
        properties={properties}
      />
    </div>
  )
}
