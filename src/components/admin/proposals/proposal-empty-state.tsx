import { FileText, Send, Handshake, FileSignature, PartyPopper, ArrowRight } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { ProposalCreateButton } from "@/components/admin/proposals/proposal-create-button"

type RealtorOption = { id: string; user: { name: string } }

const FLOW_STEPS = [
  { icon: FileText, label: "Criar proposta" },
  { icon: Send, label: "Enviar ao cliente" },
  { icon: Handshake, label: "Negociar" },
  { icon: FileSignature, label: "Assinar" },
  { icon: PartyPopper, label: "Concluir venda" },
]

export function ProposalEmptyState({ realtors }: { realtors: RealtorOption[] }) {
  return (
    <div className="space-y-8">
      <EmptyState
        icon={FileText}
        title="Nenhuma proposta registrada"
        description="Crie a primeira proposta e acompanhe toda a negociação em um só lugar."
        action={<ProposalCreateButton realtors={realtors} />}
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
            {index < FLOW_STEPS.length - 1 ? (
              <ArrowRight className="size-4 shrink-0 text-muted-foreground/50" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
