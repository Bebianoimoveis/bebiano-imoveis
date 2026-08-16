"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Paperclip, X } from "lucide-react"

import { Sheet } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { FINANCIAL_STATUS_OPTIONS } from "@/components/admin/financial/financial-entry-status-badge"
import { createFinancialEntry, updateFinancialEntry } from "@/modules/financial/actions"
import { createFinancialAttachmentUploadSignature } from "@/modules/upload/actions"
import { uploadFinancialAttachment } from "@/modules/upload/client"
import {
  financialEntryInputSchema,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  type FinancialEntryFormValues,
  type FinancialEntryInput,
} from "@/modules/financial/schema"
type ClientOption = { id: string; name: string }
type RealtorOption = { id: string; user: { name: string } }
type PropertyOption = { id: string; code: string; title: string }

// Aceita tanto FinancialEntryListItem quanto FinancialEntryDetail — o
// formulário só precisa deste subconjunto de campos, então tipar
// estruturalmente evita acoplar este componente à forma exata do detalhe.
export type EditableFinancialEntry = {
  id: string
  type: "INCOME" | "EXPENSE"
  category: string
  description: string | null
  amount: { toString(): string }
  paidAmount: { toString(): string } | null
  status: "PENDING" | "SCHEDULED" | "PARTIAL" | "PAID" | "CANCELED"
  paymentMethod: FinancialEntryFormValues["paymentMethod"] | null
  notes: string | null
  attachmentUrl: string | null
  attachmentName: string | null
  dueDate: Date | string
  clientId: string | null
  realtorId: string | null
  propertyId: string | null
}

const PAYMENT_METHOD_OPTIONS = [
  { value: "PIX", label: "PIX" },
  { value: "TED", label: "TED" },
  { value: "CARD", label: "Cartão" },
  { value: "CASH", label: "Dinheiro" },
  { value: "BOLETO", label: "Boleto" },
  { value: "TRANSFER", label: "Transferência" },
  { value: "CHECK", label: "Cheque" },
]

function toDateInputValue(date: Date | string | null | undefined) {
  if (!date) return ""
  return new Date(date).toISOString().slice(0, 10)
}

export function FinancialEntryFormSheet({
  open,
  onOpenChange,
  defaultType = "INCOME",
  entry,
  clients,
  realtors,
  properties,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultType?: "INCOME" | "EXPENSE"
  entry?: EditableFinancialEntry | null
  clients: ClientOption[]
  realtors: RealtorOption[]
  properties: PropertyOption[]
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const isEditing = Boolean(entry)

  const form = useForm<FinancialEntryFormValues, unknown, FinancialEntryInput>({
    resolver: zodResolver(financialEntryInputSchema),
    defaultValues: {
      type: defaultType,
      category: "",
      amount: "" as unknown as number,
      dueDate: "" as unknown as Date,
      status: "PENDING",
      installments: 1,
    },
  })

  useEffect(() => {
    if (!open) return
    if (entry) {
      form.reset({
        type: entry.type,
        category: entry.category,
        description: entry.description ?? undefined,
        amount: Number(entry.amount) as unknown as number,
        paidAmount: entry.paidAmount ? (Number(entry.paidAmount) as unknown as number) : undefined,
        status: entry.status,
        paymentMethod: entry.paymentMethod ?? undefined,
        notes: entry.notes ?? undefined,
        attachmentUrl: entry.attachmentUrl ?? undefined,
        attachmentName: entry.attachmentName ?? undefined,
        dueDate: toDateInputValue(entry.dueDate) as unknown as Date,
        clientId: entry.clientId ?? undefined,
        realtorId: entry.realtorId ?? undefined,
        propertyId: entry.propertyId ?? undefined,
      })
    } else {
      form.reset({
        type: defaultType,
        category: "",
        amount: "" as unknown as number,
        dueDate: "" as unknown as Date,
        status: "PENDING",
        installments: 1,
      })
    }
  }, [open, entry, defaultType, form])

  const type = form.watch("type")
  const status = form.watch("status")
  const amount = form.watch("amount")
  const installments = Number(form.watch("installments")) || 1
  const attachmentUrl = form.watch("attachmentUrl")
  const attachmentName = form.watch("attachmentName")
  const categories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const isInstallmentPlan = !isEditing && installments > 1

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const signature = await createFinancialAttachmentUploadSignature()
      const uploaded = await uploadFinancialAttachment(file, signature)
      form.setValue("attachmentUrl", uploaded.url)
      form.setValue("attachmentName", uploaded.name)
      toast.success("Comprovante anexado.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar comprovante.")
    } finally {
      setIsUploading(false)
      e.target.value = ""
    }
  }

  async function onSubmit(values: FinancialEntryInput) {
    setIsSubmitting(true)
    try {
      if (isEditing && entry) {
        await updateFinancialEntry(entry.id, values)
        toast.success("Lançamento atualizado.")
      } else {
        await createFinancialEntry(values)
        toast.success(values.type === "INCOME" ? "Receita criada." : "Despesa criada.")
      }
      onOpenChange(false)
      router.refresh()
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar lançamento.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      side="right"
      title={isEditing ? "Editar lançamento" : type === "INCOME" ? "Nova receita" : "Nova despesa"}
      className="w-full max-w-md"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-4 p-5">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v)
                      form.setValue("category", "")
                      if (v === "EXPENSE") {
                        form.setValue("clientId", undefined)
                        form.setValue("propertyId", undefined)
                      }
                    }}
                    value={field.value}
                    disabled={isEditing}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="INCOME">Receita</SelectItem>
                      <SelectItem value="EXPENSE">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Comissão venda AP-0123" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <CurrencyInput value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimento</FormLabel>
                    <FormControl>
                      <Input type="date" required value={String(field.value ?? "")} onChange={(e) => field.onChange(e.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!isEditing ? (
              <FormField
                control={form.control}
                name="installments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parcelas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        value={String(field.value ?? 1)}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    {isInstallmentPlan && amount ? (
                      <p className="text-xs text-muted-foreground">
                        Gera {installments} lançamentos mensais a partir do vencimento acima, de{" "}
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                          Number(amount) / installments
                        )}{" "}
                        cada.
                      </p>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <div className={isInstallmentPlan ? "" : "grid grid-cols-2 gap-3"}>
              {!isInstallmentPlan ? (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FINANCIAL_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_METHOD_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!isInstallmentPlan && (status === "PARTIAL" || status === "PAID") ? (
              <FormField
                control={form.control}
                name="paidAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor pago</FormLabel>
                    <FormControl>
                      <CurrencyInput value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {type === "INCOME" ? (
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente (opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Nenhum" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <FormField
              control={form.control}
              name="realtorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Corretor (opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Nenhum" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {realtors.map((realtor) => (
                        <SelectItem key={realtor.id} value={realtor.id}>
                          {realtor.user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {type === "INCOME" ? (
              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imóvel (opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Nenhum" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.code} · {property.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium">Comprovante (opcional)</label>
              {attachmentUrl ? (
                <div className="flex items-center gap-2 rounded-lg border border-border/60 p-2 text-sm">
                  <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                  <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-primary">
                    {attachmentName ?? "Ver comprovante"}
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      form.setValue("attachmentUrl", undefined)
                      form.setValue("attachmentName", undefined)
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} disabled={isUploading} />
              )}
              {isUploading ? <p className="text-xs text-muted-foreground">Enviando...</p> : null}
            </div>
          </div>

          <div className="border-t border-border/60 p-4">
            <Button type="submit" className="w-full" disabled={isSubmitting || isUploading}>
              {isSubmitting ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar lançamento"}
            </Button>
          </div>
        </form>
      </Form>
    </Sheet>
  )
}
