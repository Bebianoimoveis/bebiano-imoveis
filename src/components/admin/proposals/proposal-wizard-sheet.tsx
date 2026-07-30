"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import NextImage from "next/image"
import { toast } from "sonner"
import { AlertTriangle, Bath, BedDouble, Car, Check, ImageOff, Search } from "lucide-react"

import { Sheet } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/format"
import { createProposalWizard } from "@/modules/proposal/actions"
import { suggestClients, createClientManually } from "@/modules/client/actions"
import { findPropertyByCode } from "@/modules/property/actions"
import type { PropertyListItem } from "@/modules/property/repository"

type RealtorOption = { id: string; user: { name: string } }
type ClientChoice = { id: string; label: string; phone?: string; email?: string }

const PAYMENT_METHODS = ["À vista", "Financiado", "Financiado + FGTS", "Parcelado com a imobiliária"]

const STEPS = ["Cliente", "Imóvel", "Valores", "Condições", "Resumo"] as const

function coverUrl(property: PropertyListItem) {
  return property.images.find((image) => image.isCover)?.url ?? property.images[0]?.url ?? null
}

export function ProposalWizardSheet({
  open,
  onOpenChange,
  realtors,
  leadId,
  fixedClientId,
  fixedClientLabel,
  fixedPropertyId,
  fixedPropertyLabel,
  contextLabel,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  realtors: RealtorOption[]
  leadId?: string
  fixedClientId?: string
  fixedClientLabel?: string
  fixedPropertyId?: string
  fixedPropertyLabel?: string
  contextLabel?: string
}) {
  const router = useRouter()
  const startStep = fixedClientId && fixedPropertyId ? 3 : fixedClientId || fixedPropertyId ? 2 : 1
  const [step, setStep] = useState(startStep)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Passo 1 — Cliente
  const [client, setClient] = useState<ClientChoice | null>(
    fixedClientId ? { id: fixedClientId, label: fixedClientLabel ?? "Cliente" } : null
  )
  const [clientQuery, setClientQuery] = useState("")
  const [clientResults, setClientResults] = useState<ClientChoice[]>([])
  const [creatingClient, setCreatingClient] = useState(false)
  const [newClientName, setNewClientName] = useState("")
  const [newClientPhone, setNewClientPhone] = useState("")

  // Passo 2 — Imóvel
  const [property, setProperty] = useState<PropertyListItem | null>(null)
  const [propertyCode, setPropertyCode] = useState("")
  const [propertyError, setPropertyError] = useState<string | null>(null)

  // Passo 3 — Valores
  const [realtorId, setRealtorId] = useState(realtors[0]?.id ?? "")
  const [value, setValue] = useState("")
  const [originalValue, setOriginalValue] = useState("")
  const [downPayment, setDownPayment] = useState("")
  const [financingValue, setFinancingValue] = useState("")
  const [fgtsValue, setFgtsValue] = useState("")
  const [installments, setInstallments] = useState("")
  const [installmentValue, setInstallmentValue] = useState("")
  const [commissionPercent, setCommissionPercent] = useState("")

  // Passo 4 — Condições
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0])
  const [validUntil, setValidUntil] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (!open) return
    setStep(startStep)
  }, [open, startStep])

  useEffect(() => {
    if (clientQuery.trim().length < 2) {
      setClientResults([])
      return
    }
    const timeout = setTimeout(() => {
      suggestClients(clientQuery).then((rows) =>
        setClientResults(rows.map((row) => ({ id: row.id, label: `${row.name} · ${row.phone}` })))
      )
    }, 200)
    return () => clearTimeout(timeout)
  }, [clientQuery])

  async function handleCreateClient() {
    if (!newClientName.trim() || !newClientPhone.trim()) {
      toast.error("Informe nome e telefone.")
      return
    }
    try {
      const created = await createClientManually({ name: newClientName, phone: newClientPhone })
      setClient({ id: created.id, label: `${created.name} · ${created.phone}` })
      setCreatingClient(false)
      setNewClientName("")
      setNewClientPhone("")
      toast.success("Cliente cadastrado.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao cadastrar cliente.")
    }
  }

  async function handleLookupProperty() {
    setPropertyError(null)
    const found = await findPropertyByCode(propertyCode.trim())
    if (!found) {
      setPropertyError("Imóvel não encontrado com esse código.")
      setProperty(null)
      return
    }
    setProperty(found)
    setOriginalValue(found.price.toString())
    if (found.realtorId) setRealtorId(found.realtorId)
  }

  const numericValue = Number(value) || 0
  const numericOriginal = Number(originalValue) || 0
  const discount = numericOriginal > 0 ? numericOriginal - numericValue : 0
  const discountPercent = numericOriginal > 0 ? (discount / numericOriginal) * 100 : 0

  const simulationTotal =
    (Number(downPayment) || 0) + (Number(financingValue) || 0) + (Number(fgtsValue) || 0) +
    (Number(installments) || 0) * (Number(installmentValue) || 0)
  const simulationDiff = numericValue > 0 ? simulationTotal - numericValue : 0
  const showSimulationWarning =
    simulationTotal > 0 && numericValue > 0 && Math.abs(simulationDiff) > 0.01

  function canAdvance() {
    if (step === 1) return !!client
    if (step === 2) return !!(property || fixedPropertyId)
    if (step === 3) return numericValue > 0 && !!realtorId
    return true
  }

  function reset() {
    setStep(startStep)
    if (!fixedClientId) setClient(null)
    setClientQuery("")
    setProperty(null)
    setPropertyCode("")
    setValue("")
    setOriginalValue("")
    setDownPayment("")
    setFinancingValue("")
    setFgtsValue("")
    setInstallments("")
    setInstallmentValue("")
    setCommissionPercent("")
    setPaymentMethod(PAYMENT_METHODS[0])
    setValidUntil("")
    setNotes("")
  }

  async function handleSubmit() {
    const finalClientId = client?.id ?? fixedClientId
    const finalPropertyId = property?.id ?? fixedPropertyId
    if (!finalClientId || !finalPropertyId || numericValue <= 0) {
      toast.error("Preencha cliente, imóvel e valor.")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createProposalWizard({
        clientId: finalClientId,
        propertyId: finalPropertyId,
        realtorId,
        leadId,
        value: numericValue,
        originalValue: numericOriginal || undefined,
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
      toast.success("Proposta criada.")
      reset()
      onOpenChange(false)
      router.refresh()
      return result
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar proposta.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right" className="w-full max-w-lg" title="Nova Proposta">
      <div className="flex-1 overflow-y-auto p-5">
        {contextLabel ? <p className="mb-4 text-sm text-muted-foreground">{contextLabel}</p> : null}

        {/* Barra de progresso */}
        <div className="mb-6 flex items-center gap-1.5">
          {STEPS.map((label, index) => {
            const stepNumber = index + 1
            const isActive = stepNumber === step
            const isDone = stepNumber < step
            return (
              <div key={label} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                    isActive && "bg-primary text-primary-foreground",
                    isDone && "bg-primary/20 text-primary",
                    !isActive && !isDone && "bg-secondary text-muted-foreground"
                  )}
                >
                  {isDone ? <Check className="size-3.5" /> : stepNumber}
                </div>
                <span className="hidden text-[10px] text-muted-foreground sm:block">{label}</span>
              </div>
            )
          })}
        </div>

        {/* Passo 1: Cliente */}
        {step === 1 ? (
          <div className="space-y-4">
            <h3 className="font-heading text-base font-semibold">Selecionar cliente</h3>
            {client ? (
              <div className="flex items-center justify-between rounded-xl border border-border/60 p-3 text-sm">
                <span className="font-medium">{client.label}</span>
                <Button variant="ghost" size="sm" onClick={() => setClient(null)}>
                  Trocar
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={clientQuery}
                    onChange={(e) => setClientQuery(e.target.value)}
                    placeholder="Buscar cliente por nome, telefone ou código"
                    className="pl-8"
                  />
                </div>
                {clientResults.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-border">
                    {clientResults.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => setClient(result)}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-secondary"
                      >
                        {result.label}
                      </button>
                    ))}
                  </div>
                ) : null}

                {!creatingClient ? (
                  <Button type="button" variant="outline" className="w-full" onClick={() => setCreatingClient(true)}>
                    Cadastrar novo cliente
                  </Button>
                ) : (
                  <div className="space-y-3 rounded-xl border border-border/60 p-3">
                    <Input value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="Nome completo" />
                    <Input value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} placeholder="Telefone" />
                    <div className="flex gap-2">
                      <Button type="button" size="sm" onClick={handleCreateClient}>
                        Cadastrar
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setCreatingClient(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : null}

        {/* Passo 2: Imóvel */}
        {step === 2 ? (
          <div className="space-y-4">
            <h3 className="font-heading text-base font-semibold">Selecionar imóvel</h3>
            {property ? (
              <div className="space-y-3 rounded-xl border border-border/60 p-3">
                <div className="flex gap-3">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    {coverUrl(property) ? (
                      <NextImage src={coverUrl(property)!} alt={property.title} fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <ImageOff className="size-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{property.title}</p>
                    <p className="text-xs text-muted-foreground">{property.code} · {property.status}</p>
                    <p className="text-sm font-semibold text-primary">{formatCurrency(property.price.toString())}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><BedDouble className="size-3.5" /> {property.bedrooms}</span>
                  <span className="flex items-center gap-1"><Bath className="size-3.5" /> {property.bathrooms}</span>
                  <span className="flex items-center gap-1"><Car className="size-3.5" /> {property.parkingSpots}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setProperty(null)}>
                  Trocar imóvel
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Código do imóvel</Label>
                <div className="flex gap-2">
                  <Input value={propertyCode} onChange={(e) => setPropertyCode(e.target.value)} placeholder="Ex: BB-1024" />
                  <Button type="button" variant="outline" onClick={handleLookupProperty}>
                    Buscar
                  </Button>
                </div>
                {propertyError ? <p className="text-sm text-destructive">{propertyError}</p> : null}
              </div>
            )}
          </div>
        ) : null}

        {/* Passo 3: Valores */}
        {step === 3 ? (
          <div className="space-y-4">
            <h3 className="font-heading text-base font-semibold">Valores</h3>
            <div className="space-y-1.5">
              <Label>Corretor</Label>
              <Select value={realtorId} onValueChange={setRealtorId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {realtors.map((realtor) => (
                    <SelectItem key={realtor.id} value={realtor.id}>
                      {realtor.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            {numericOriginal > 0 && numericValue > 0 ? (
              <p className="text-xs text-muted-foreground">
                Desconto: <span className="font-medium text-foreground">{formatCurrency(discount)}</span> ({discountPercent.toFixed(1)}%)
              </p>
            ) : null}

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

            {simulationTotal > 0 ? (
              <div
                className={cn(
                  "flex items-start gap-2 rounded-lg border p-3 text-xs",
                  showSimulationWarning
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                )}
              >
                {showSimulationWarning ? <AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> : <Check className="mt-0.5 size-3.5 shrink-0" />}
                <div>
                  <p className="font-medium">
                    Simulação: {formatCurrency(simulationTotal)} {showSimulationWarning ? "≠" : "="} valor ofertado
                  </p>
                  {showSimulationWarning ? (
                    <p>Diferença de {formatCurrency(Math.abs(simulationDiff))} em relação ao valor ofertado.</p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Passo 4: Condições */}
        {step === 4 ? (
          <div className="space-y-4">
            <h3 className="font-heading text-base font-semibold">Condições</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Forma de pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Validade da proposta</Label>
                <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Condições especiais, prazos, observações..." />
            </div>
          </div>
        ) : null}

        {/* Passo 5: Resumo */}
        {step === 5 ? (
          <div className="space-y-4">
            <h3 className="font-heading text-base font-semibold">Resumo</h3>
            <div className="space-y-2 rounded-xl border border-border/60 p-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Cliente</span><span className="font-medium">{client?.label ?? fixedClientLabel}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Imóvel</span><span className="font-medium">{property?.title ?? fixedPropertyLabel}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Corretor</span><span className="font-medium">{realtors.find((r) => r.id === realtorId)?.user.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Valor ofertado</span><span className="font-medium">{formatCurrency(numericValue)}</span></div>
              {discount > 0 ? (
                <div className="flex justify-between"><span className="text-muted-foreground">Desconto</span><span className="font-medium">{formatCurrency(discount)}</span></div>
              ) : null}
              {paymentMethod ? (
                <div className="flex justify-between"><span className="text-muted-foreground">Pagamento</span><span className="font-medium">{paymentMethod}</span></div>
              ) : null}
              {validUntil ? (
                <div className="flex justify-between"><span className="text-muted-foreground">Válida até</span><span className="font-medium">{new Date(validUntil).toLocaleDateString("pt-BR")}</span></div>
              ) : null}
            </div>
            {notes ? <p className="text-sm text-muted-foreground">{notes}</p> : null}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-border/60 p-4">
        <Button variant="outline" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))}>
          Voltar
        </Button>
        {step < 5 ? (
          <Button disabled={!canAdvance()} onClick={() => setStep((s) => Math.min(5, s + 1))}>
            Avançar
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Criando..." : "Criar proposta"}
          </Button>
        )}
      </div>
    </Sheet>
  )
}
