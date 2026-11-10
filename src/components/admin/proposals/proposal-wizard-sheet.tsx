"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import NextImage from "next/image"
import { toast } from "sonner"
import { AlertTriangle, Bath, BedDouble, Car, Check, ImageOff, Search } from "lucide-react"

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
import { cn } from "@/lib/utils"
import { formatCurrency, formatDateOnlyBR } from "@/lib/format"
import { createProposalWizard } from "@/modules/proposal/actions"
import { suggestClients, createClientManually, getClientDealContext } from "@/modules/client/actions"
import { findPropertyByCode } from "@/modules/property/actions"
import { PAYMENT_METHODS, paymentFields } from "@/modules/proposal/payment"
import { PropertyPicker } from "@/components/admin/property-picker"
import type { PropertyListItem } from "@/modules/property/repository"

type RealtorOption = { id: string; user: { name: string } }
type ClientChoice = { id: string; label: string; detail?: string }
type ClientContext = NonNullable<Awaited<ReturnType<typeof getClientDealContext>>>

const CONTRACT_STATUS_TEXT: Record<string, string> = {
  DRAFT: "rascunho",
  ACTIVE: "ativo",
  COMPLETED: "concluído",
  CANCELED: "cancelado",
}


const STEPS = ["Cliente", "Imóvel", "Valores", "Condições", "Resumo"] as const

// Resumo do que o cliente já tem com a imobiliária, logo abaixo dele.
function ClientHistory({ context }: { context: ClientContext | null }) {
  if (!context || (context.contracts.length === 0 && context.proposalsCount === 0)) return null
  return (
    <div className="space-y-1 rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-xs">
      <p className="font-medium text-foreground">
        Este cliente já tem{" "}
        {[
          context.contracts.length
            ? `${context.contracts.length} contrato${context.contracts.length === 1 ? "" : "s"}`
            : null,
          context.proposalsCount
            ? `${context.proposalsCount} proposta${context.proposalsCount === 1 ? "" : "s"}`
            : null,
        ]
          .filter(Boolean)
          .join(" e ")}{" "}
        — o corretor e os imóveis ligados a ele já aparecem sugeridos.
      </p>
      {context.contracts.slice(0, 3).map((contract) => (
        <p key={contract.id} className="text-muted-foreground">
          Contrato {contract.propertyCode} · {CONTRACT_STATUS_TEXT[contract.status] ?? contract.status} ·{" "}
          {formatCurrency(contract.value)}
        </p>
      ))}
    </div>
  )
}

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
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0])
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
        setClientResults(
          rows.map((row) => ({
            id: row.id,
            label: row.name,
            detail: [row.cpf ? `CPF ${row.cpf}` : row.rg ? `RG ${row.rg}` : null, row.phone, row.code]
              .filter(Boolean)
              .join(" · "),
          }))
        )
      )
    }, 200)
    return () => clearTimeout(timeout)
  }, [clientQuery])

  // Cliente escolhido → busca o que já está ligado a ele (contratos,
  // propostas, interesses) pra sugerir o imóvel e o corretor sozinho.
  const selectedClientId = client?.id ?? fixedClientId ?? null
  const [clientContext, setClientContext] = useState<ClientContext | null>(null)
  const [contextFor, setContextFor] = useState<string | null>(null)
  if (open && selectedClientId !== contextFor) {
    setContextFor(selectedClientId)
    setClientContext(null)
  }
  useEffect(() => {
    if (!open || !selectedClientId) return
    let cancelled = false
    getClientDealContext(selectedClientId)
      .then((context) => {
        if (cancelled || !context) return
        setClientContext(context)
        if (context.realtorId && realtors.some((r) => r.id === context.realtorId)) setRealtorId(context.realtorId)
        // Só um imóvel ligado ao cliente → já vem escolhido.
        if (context.properties.length === 1 && !fixedPropertyId) pickProperty(context.properties[0].code, context)
      })
      .catch(() => null)
    return () => {
      cancelled = true
    }
  }, [open, selectedClientId, realtors])

  async function pickProperty(code: string, context: ClientContext | null = clientContext) {
    setPropertyError(null)
    const found = await findPropertyByCode(code)
    if (!found) {
      setPropertyError("Imóvel não encontrado.")
      return
    }
    setProperty(found)
    setOriginalValue(found.price.toString())
    // Corretor que já atende o cliente tem prioridade; senão, o do imóvel.
    const clientRealtor = context?.realtorId
    if (clientRealtor && realtors.some((r) => r.id === clientRealtor)) setRealtorId(clientRealtor)
    else if (found.realtorId) setRealtorId(found.realtorId)
  }

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

  // Cada forma de pagamento pede só os campos que fazem sentido: à vista
  // não tem entrada/financiamento/parcelas, é o valor total.
  const fields = paymentFields(paymentMethod)
  const isCash = !fields.downPayment && !fields.financing && !fields.fgts && !fields.installments
  const numericValue = Number(value) || 0
  const numericOriginal = Number(originalValue) || 0
  const discount = numericOriginal > 0 ? numericOriginal - numericValue : 0
  const discountPercent = numericOriginal > 0 ? (discount / numericOriginal) * 100 : 0

  const numDown = fields.downPayment ? Number(downPayment) || 0 : 0
  const numFinancing = fields.financing ? Number(financingValue) || 0 : 0
  const numFgts = fields.fgts ? Number(fgtsValue) || 0 : 0
  const numInstallments = fields.installments ? Number(installments) || 0 : 0
  const numInstallmentValue = fields.installments ? Number(installmentValue) || 0 : 0
  const installmentsTotal = numInstallments * numInstallmentValue
  const simulationTotal = numDown + numFinancing + numFgts + installmentsTotal
  const simulationDiff = numericValue > 0 ? simulationTotal - numericValue : 0
  const showSimulationWarning =
    simulationTotal > 0 && numericValue > 0 && Math.abs(simulationDiff) > 0.01
  // O que ainda falta cobrir do valor ofertado — base dos botões de atalho.
  const remaining = numericValue > 0 ? Math.max(0, numericValue - simulationTotal) : 0
  const roundMoney = (n: number) => Math.round(n * 100) / 100

  function fillFinancingWithRemaining() {
    setFinancingValue(String(roundMoney(numFinancing + remaining)))
  }

  // Parcela = o que falta cobrir (antes das parcelas) dividido pela quantidade.
  function calculateInstallmentValue() {
    if (numInstallments <= 0) return
    const toCover = Math.max(0, numericValue - numDown - numFinancing - numFgts)
    setInstallmentValue(String(roundMoney(toCover / numInstallments)))
  }

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
    setPropertyError(null)
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
        // Só vai o que a forma de pagamento escolhida usa.
        downPayment: numDown || undefined,
        financingValue: numFinancing || undefined,
        fgtsValue: numFgts || undefined,
        installments: numInstallments || undefined,
        installmentValue: numInstallmentValue || undefined,
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
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-border/60 p-3 text-sm">
                  <span className="min-w-0">
                    <span className="block font-medium">{client.label}</span>
                    {client.detail ? <span className="block text-xs text-muted-foreground">{client.detail}</span> : null}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setClient(null)
                      setProperty(null)
                    }}
                  >
                    Trocar
                  </Button>
                </div>
                <ClientHistory context={clientContext} />
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={clientQuery}
                    onChange={(e) => setClientQuery(e.target.value)}
                    placeholder="Buscar cliente por nome, CPF, RG, telefone ou código"
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
                        <span className="block font-medium">{result.label}</span>
                        {result.detail ? (
                          <span className="block text-xs text-muted-foreground">{result.detail}</span>
                        ) : null}
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
              <div className="space-y-4">
                {clientContext && clientContext.properties.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Já ligado a esse cliente:</p>
                    {clientContext.properties.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => pickProperty(option.code)}
                        className="flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-lg border border-border/60 p-2 text-left text-sm transition-colors hover:border-primary"
                      >
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-secondary">
                          {option.imageUrl ? (
                            <NextImage src={option.imageUrl} alt="" fill className="object-cover" sizes="48px" />
                          ) : (
                            <div className="flex size-full items-center justify-center text-muted-foreground">
                              <ImageOff className="size-4" />
                            </div>
                          )}
                        </div>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{option.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {option.code} · {formatCurrency(option.price)}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {option.reason}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label>
                    {clientContext && clientContext.properties.length > 0 ? "Ou buscar outro imóvel" : "Buscar imóvel"}
                  </Label>
                  <PropertyPicker onSelect={(option) => pickProperty(option.code)} />
                  {propertyError ? <p className="text-sm text-destructive">{propertyError}</p> : null}
                </div>
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

            {numericOriginal > 0 && numericValue > 0 ? (
              <p className="text-xs text-muted-foreground">
                Desconto: <span className="font-medium text-foreground">{formatCurrency(discount)}</span> ({discountPercent.toFixed(1)}%)
              </p>
            ) : null}

            {isCash ? (
              <p className="rounded-lg bg-secondary/60 px-3 py-2.5 text-sm text-muted-foreground">
                Pagamento à vista: o cliente paga o valor ofertado de uma vez
                {numericValue > 0 ? <> ({formatCurrency(numericValue)})</> : null}. Sem entrada, financiamento ou
                parcelas.
              </p>
            ) : (
              <div className="space-y-3 rounded-xl border border-border/60 p-4">
                <p className="text-sm font-medium">Como o valor será pago</p>
                <div className="grid grid-cols-2 gap-3">
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
                      {remaining > 0.01 ? (
                        <button
                          type="button"
                          onClick={fillFinancingWithRemaining}
                          className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                        >
                          Financiar o restante ({formatCurrency(remaining)})
                        </button>
                      ) : null}
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
                        {numInstallments > 0 && numericValue > 0 ? (
                          <button
                            type="button"
                            onClick={calculateInstallmentValue}
                            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                          >
                            Calcular com o que falta
                          </button>
                        ) : null}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Comissão (%)</Label>
              <Input type="number" step="0.01" value={commissionPercent} onChange={(e) => setCommissionPercent(e.target.value)} />
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
            <div className="space-y-1.5">
              <Label>Validade da proposta</Label>
              <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
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
                <div className="flex justify-between"><span className="text-muted-foreground">Válida até</span><span className="font-medium">{formatDateOnlyBR(validUntil)}</span></div>
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
