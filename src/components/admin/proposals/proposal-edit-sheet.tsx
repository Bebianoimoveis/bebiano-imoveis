"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Sheet } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateProposal } from "@/modules/proposal/actions"
import type { ProposalDetail } from "@/modules/proposal/repository"

export function ProposalEditSheet({
  open,
  onOpenChange,
  proposal,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  proposal: ProposalDetail
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [value, setValue] = useState(proposal.value.toString())
  const [originalValue, setOriginalValue] = useState(proposal.originalValue?.toString() ?? "")
  const [downPayment, setDownPayment] = useState(proposal.downPayment?.toString() ?? "")
  const [financingValue, setFinancingValue] = useState(proposal.financingValue?.toString() ?? "")
  const [fgtsValue, setFgtsValue] = useState(proposal.fgtsValue?.toString() ?? "")
  const [installments, setInstallments] = useState(proposal.installments?.toString() ?? "")
  const [installmentValue, setInstallmentValue] = useState(proposal.installmentValue?.toString() ?? "")
  const [commissionPercent, setCommissionPercent] = useState(proposal.commissionPercent?.toString() ?? "")
  const [paymentMethod, setPaymentMethod] = useState(proposal.paymentMethod ?? "")
  const [validUntil, setValidUntil] = useState(
    proposal.validUntil ? new Date(proposal.validUntil).toISOString().slice(0, 10) : ""
  )
  const [notes, setNotes] = useState(proposal.notes ?? "")

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      await updateProposal(proposal.id, {
        propertyId: proposal.propertyId,
        clientId: proposal.clientId,
        realtorId: proposal.realtorId,
        value: Number(value),
        originalValue: originalValue ? Number(originalValue) : undefined,
        downPayment: downPayment ? Number(downPayment) : undefined,
        financingValue: financingValue ? Number(financingValue) : undefined,
        fgtsValue: fgtsValue ? Number(fgtsValue) : undefined,
        installments: installments ? Number(installments) : undefined,
        installmentValue: installmentValue ? Number(installmentValue) : undefined,
        commissionPercent: commissionPercent ? Number(commissionPercent) : undefined,
        paymentMethod,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        notes,
      })
      toast.success("Proposta atualizada.")
      onOpenChange(false)
      router.refresh()
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right" title="Editar proposta">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Valor anunciado</Label>
            <Input type="number" step="0.01" value={originalValue} onChange={(e) => setOriginalValue(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Valor ofertado</Label>
            <Input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Entrada</Label>
            <Input type="number" step="0.01" value={downPayment} onChange={(e) => setDownPayment(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Financiamento</Label>
            <Input type="number" step="0.01" value={financingValue} onChange={(e) => setFinancingValue(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>FGTS</Label>
            <Input type="number" step="0.01" value={fgtsValue} onChange={(e) => setFgtsValue(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Comissão (%)</Label>
            <Input type="number" step="0.01" value={commissionPercent} onChange={(e) => setCommissionPercent(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Parcelas (qtd.)</Label>
            <Input type="number" value={installments} onChange={(e) => setInstallments(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Valor da parcela</Label>
            <Input type="number" step="0.01" value={installmentValue} onChange={(e) => setInstallmentValue(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Forma de pagamento</Label>
            <Input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Validade</Label>
            <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Observações</Label>
          <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      <div className="border-t border-border/60 p-4">
        <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </Sheet>
  )
}
