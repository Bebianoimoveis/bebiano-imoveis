"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Copy, FileText, Paperclip, Pencil, Trash2, CheckCircle2 } from "lucide-react"

import { Sheet } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { ClientAvatar } from "@/components/admin/clients/client-avatar"
import { FinancialEntryStatusBadge } from "@/components/admin/financial/financial-entry-status-badge"
import { FinancialEntryInteractionForm } from "@/components/admin/financial/financial-entry-interaction-form"
import { FinancialEntryFormSheet } from "@/components/admin/financial/financial-entry-form-sheet"
import {
  getAdminFinancialEntry,
  duplicateFinancialEntry,
  deleteFinancialEntry,
  markFinancialEntryStatus,
} from "@/modules/financial/actions"
import { formatCurrency } from "@/lib/format"
import type { FinancialEntryDetail } from "@/modules/financial/repository"

type ClientOption = { id: string; name: string }
type RealtorOption = { id: string; user: { name: string } }
type PropertyOption = { id: string; code: string; title: string }

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PIX: "PIX",
  TED: "TED",
  CARD: "Cartão",
  CASH: "Dinheiro",
  BOLETO: "Boleto",
  TRANSFER: "Transferência",
  CHECK: "Cheque",
}

export function FinancialEntryDetailPanel({
  entryId,
  onClose,
  clients,
  realtors,
  properties,
}: {
  entryId: string | null
  onClose: () => void
  clients: ClientOption[]
  realtors: RealtorOption[]
  properties: PropertyOption[]
}) {
  const router = useRouter()
  const [entry, setEntry] = useState<FinancialEntryDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    if (!entryId) {
      setEntry(null)
      return
    }
    setLoading(true)
    getAdminFinancialEntry(entryId)
      .then(setEntry)
      .finally(() => setLoading(false))
  }, [entryId])

  function refetch() {
    if (!entryId) return
    getAdminFinancialEntry(entryId).then(setEntry)
  }

  function runAction(action: () => Promise<unknown>, message: string) {
    startTransition(async () => {
      try {
        await action()
        toast.success(message)
        refetch()
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao atualizar.")
      }
    })
  }

  function handleDelete() {
    if (!entryId) return
    startTransition(async () => {
      try {
        await deleteFinancialEntry(entryId)
        toast.success("Lançamento excluído.")
        onClose()
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao excluir.")
      }
    })
  }

  return (
    <>
      <Sheet open={!!entryId} onOpenChange={(open) => !open && onClose()} side="right" className="w-full max-w-xl">
        {loading || !entry ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="border-b border-border/60 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {entry.client ? (
                    <ClientAvatar name={entry.client.name} />
                  ) : (
                    <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <FileText className="size-4" />
                    </span>
                  )}
                  <div>
                    <p className="font-heading text-lg font-semibold">{entry.category}</p>
                    <p className="text-sm text-muted-foreground">
                      {entry.type === "INCOME" ? "Receita" : "Despesa"} · {formatCurrency(entry.amount.toString())}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Fechar"
                  onClick={onClose}
                  className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <FinancialEntryStatusBadge status={entry.status} type={entry.type} dueDate={entry.dueDate} />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditOpen(true)}>
                  <Pencil className="size-3.5" /> Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={isPending}
                  onClick={() => runAction(() => duplicateFinancialEntry(entry.id), "Lançamento duplicado.")}
                >
                  <Copy className="size-3.5" /> Duplicar
                </Button>
                {entry.status !== "PAID" && entry.status !== "CANCELED" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    disabled={isPending}
                    onClick={() =>
                      runAction(
                        () => markFinancialEntryStatus(entry.id, "PAID"),
                        entry.type === "INCOME" ? "Marcado como recebido." : "Marcado como pago."
                      )
                    }
                  >
                    <CheckCircle2 className="size-3.5" />
                    {entry.type === "INCOME" ? "Marcar como recebido" : "Marcar como pago"}
                  </Button>
                ) : null}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive">
                      <Trash2 className="size-3.5" /> Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir este lançamento?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Essa ação não pode ser desfeita. Se o lançamento só não vai mais acontecer, prefira cancelá-lo em
                        vez de excluir.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel />
                      <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <Tabs defaultValue="geral" className="flex min-h-0 flex-1 flex-col">
              <TabsList className="mx-5 mt-3 w-fit">
                <TabsTrigger value="geral">Visão Geral</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="anexo">Anexo</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto p-5">
                <TabsContent value="geral" className="space-y-5">
                  {entry.description ? (
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">Descrição</p>
                      <p className="font-medium">{entry.description}</p>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-border/60 p-3">
                      <p className="text-xs text-muted-foreground">Valor</p>
                      <p className="font-semibold text-primary">{formatCurrency(entry.amount.toString())}</p>
                    </div>
                    {entry.paidAmount ? (
                      <div className="rounded-xl border border-border/60 p-3">
                        <p className="text-xs text-muted-foreground">Valor pago</p>
                        <p className="font-medium">{formatCurrency(entry.paidAmount.toString())}</p>
                      </div>
                    ) : null}
                    <div className="rounded-xl border border-border/60 p-3">
                      <p className="text-xs text-muted-foreground">Vencimento</p>
                      <p className="font-medium">{new Date(entry.dueDate).toLocaleDateString("pt-BR")}</p>
                    </div>
                    {entry.paidAt ? (
                      <div className="rounded-xl border border-border/60 p-3">
                        <p className="text-xs text-muted-foreground">Pago em</p>
                        <p className="font-medium">{new Date(entry.paidAt).toLocaleDateString("pt-BR")}</p>
                      </div>
                    ) : null}
                    {entry.paymentMethod ? (
                      <div className="rounded-xl border border-border/60 p-3">
                        <p className="text-xs text-muted-foreground">Forma de pagamento</p>
                        <p className="font-medium">{PAYMENT_METHOD_LABELS[entry.paymentMethod]}</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground">Cliente</p>
                      <p className="font-medium">{entry.client?.name ?? "—"}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground">Corretor</p>
                      <p className="font-medium">{entry.realtor?.user.name ?? "—"}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground">Imóvel</p>
                      <p className="font-medium">
                        {entry.property ? `${entry.property.code} · ${entry.property.title}` : "—"}
                      </p>
                    </div>
                    {entry.contract ? (
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground">Contrato</p>
                        <p className="font-medium">
                          {entry.contract.property.code} · {entry.contract.client.name}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {entry.notes ? (
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">Observações</p>
                      <p>{entry.notes}</p>
                    </div>
                  ) : null}
                </TabsContent>

                <TabsContent value="timeline" className="space-y-6">
                  <FinancialEntryInteractionForm entryId={entry.id} onSuccess={refetch} />
                  <ul className="space-y-4">
                    {entry.interactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhuma anotação registrada ainda.</p>
                    ) : (
                      entry.interactions.map((interaction) => (
                        <li key={interaction.id} className="rounded-xl border border-border/60 p-3 text-sm">
                          <p>{interaction.description}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {interaction.user.name} · {new Date(interaction.createdAt).toLocaleString("pt-BR")}
                          </p>
                        </li>
                      ))
                    )}
                  </ul>
                </TabsContent>

                <TabsContent value="anexo" className="space-y-4">
                  {entry.attachmentUrl ? (
                    <div className="flex items-center gap-2 rounded-xl border border-border/60 p-4 text-sm">
                      <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">{entry.attachmentName ?? "Comprovante"}</span>
                      <Button asChild size="sm" variant="outline">
                        <a href={entry.attachmentUrl} target="_blank" rel="noopener noreferrer">
                          Baixar
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <EmptyState
                      icon={Paperclip}
                      title="Nenhum comprovante anexado"
                      description="Anexe a nota fiscal, boleto ou comprovante deste lançamento editando-o."
                      action={
                        <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                          Anexar comprovante
                        </Button>
                      }
                    />
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}
      </Sheet>

      {entry ? (
        <FinancialEntryFormSheet
          open={editOpen}
          onOpenChange={setEditOpen}
          entry={entry}
          clients={clients}
          realtors={realtors}
          properties={properties}
          onSuccess={refetch}
        />
      ) : null}
    </>
  )
}
