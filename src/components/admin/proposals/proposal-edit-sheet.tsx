"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Sheet } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PAYMENT_METHODS, paymentFields } from "@/modules/proposal/payment"
import { updateProposal } from "@/modules/proposal/actions"
import type { AdminProposalDetail } from "@/modules/proposal/actions"

export function ProposalEditSheet({
  open,
  onOpenChange,
  proposal,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  proposal: AdminProposalDetail
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
  const fields = paymentFields(paymentMethod)
  const isCash = !fields.downPayment && !fields.financing && !fields.fgts && !fields.installments
  // Forma de pagamento antiga em texto livre continua na lista pra não sumir.
  const methodOptions: string[] = [...PAYMENT_METHODS]
  if (paymentMethod && !methodOptions.includes(paymentMethod)) methodOptions.push(paymentMethod)

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      await updateProposal(proposal.id, {
        propertyId: proposal.propertyId,
        clientId: proposal.clientId,
        realtorId: proposal.realtorId,
        value: Number(value),
        originalValue: originalValue ? Number(originalValue) : undefined,
        // Só vai o que a forma de pagamento escolhida usa.
        downPayment: fields.downPayment && downPayment ? Number(downPayment) : undefined,
        financingValue: fields.financing && financingValue ? Number(financingValue) : undefined,
        fgtsValue: fields.fgts && fgtsValue ? Number(fgtsValue) : undefined,
        installments: fields.installments && installments ? Number(installments) : undefined,
        installmentValue: fields.installments && installmentValue ? Number(installmentValue) : undefined,
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
            <CurrencyInput value={originalValue} onChange={(v) => setOriginalValue(v ? v.toString() : "")} />
          </div>
          <div className="space-y-1.5">
            <Label>Valor ofertado</Label>
            <CurrencyInput value={value} onChange={(v) => setValue(v ? v.toString() : "")} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Forma de pagamento</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {methodOptions.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isCash ? (
          <p className="rounded-lg bg-secondary/60 px-3 py-2.5 text-sm text-muted-foreground">
            Pagamento à vista: o valor ofertado é pago de uma vez, sem entrada, financiamento ou parcelas.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/60 p-4">
            {fields.downPayment ? (
              <div className="space-y-1.5">
                <Label>Entrada</Label>
                <CurrencyInput value={downPayment} onChange={(v) => setDownPayment(v ? v.toString() : "")} />
              </div>
            ) : null}
            {fields.fgts ? (
              <div className="space-y-1.5">
                <Label>FGTS</Label>
                <CurrencyInput value={fgtsValue} onChange={(v) => setFgtsValue(v ? v.toString() : "")} />
              </div>
            ) : null}
            {fields.financing ? (
              <div className="col-span-2 space-y-1.5">
                <Label>Valor financiado (banco)</Label>
                <CurrencyInput value={financingValue} onChange={(v) => setFinancingValue(v ? v.toString() : "")} />
              </div>
            ) : null}
            {fields.installments ? (
              <>
                <div className="space-y-1.5">
                  <Label>Parcelas com a imobiliária (qtd.)</Label>
                  <Input type="number" min={1} value={installments} onChange={(e) => setInstallments(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Valor de cada parcela</Label>
                  <CurrencyInput value={installmentValue} onChange={(v) => setInstallmentValue(v ? v.toString() : "")} />
                </div>
              </>
            ) : null}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Comissão (%)</Label>
            <Input type="number" step="0.01" value={commissionPercent} onChange={(e) => setCommissionPercent(e.target.value)} />
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
