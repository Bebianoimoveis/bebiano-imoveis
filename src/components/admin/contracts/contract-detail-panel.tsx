"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ExternalLink, FileSignature, Paperclip, Trash2, Upload } from "lucide-react"

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
import { ContractStatusBadge } from "@/components/admin/contracts/contract-status-badge"
import { ContractRowActions } from "@/components/admin/contracts/contract-row-actions"
import {
  getAdminContract,
  addContractAttachment,
  deleteContractAttachment,
} from "@/modules/contract/actions"
import { createContractFileUploadSignature } from "@/modules/upload/actions"
import { uploadContractFile } from "@/modules/upload/client"
import { formatCurrency, formatDateBR } from "@/lib/format"

type ContractDetail = NonNullable<Awaited<ReturnType<typeof getAdminContract>>>

export function ContractDetailPanel({
  contractId,
  onClose,
}: {
  contractId: string | null
  onClose: () => void
}) {
  const router = useRouter()
  const [contract, setContract] = useState<ContractDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!contractId) {
      setContract(null)
      return
    }
    setLoading(true)
    getAdminContract(contractId)
      .then(setContract)
      .finally(() => setLoading(false))
  }, [contractId])

  function refetch() {
    if (!contractId) return
    getAdminContract(contractId).then(setContract)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !contractId) return

    setIsUploading(true)
    try {
      const signature = await createContractFileUploadSignature()
      const uploaded = await uploadContractFile(file, signature)
      await addContractAttachment(contractId, uploaded)
      toast.success("Arquivo anexado.")
      refetch()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar o arquivo.")
    } finally {
      setIsUploading(false)
      e.target.value = ""
    }
  }

  function handleDeleteAttachment(attachmentId: string) {
    if (!contractId) return
    startTransition(async () => {
      try {
        await deleteContractAttachment(contractId, attachmentId)
        toast.success("Anexo removido.")
        refetch()
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao remover anexo.")
      }
    })
  }

  return (
    <Sheet open={!!contractId} onOpenChange={(open) => !open && onClose()} side="right" className="w-full max-w-xl">
      {loading || !contract ? (
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
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <FileSignature className="size-4" />
                </span>
                <div>
                  <p className="font-heading text-lg font-semibold">
                    {contract.property.code} · {contract.property.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {contract.client.name} · {formatCurrency(contract.value.toString())}
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

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ContractStatusBadge status={contract.status} />
              <ContractRowActions contractId={contract.id} status={contract.status} />
            </div>
          </div>

          <Tabs defaultValue="detalhes" className="flex min-h-0 flex-1 flex-col">
            <TabsList className="mx-5 mt-3 w-fit">
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
              <TabsTrigger value="anexos">Anexos{contract.attachments.length > 0 ? ` (${contract.attachments.length})` : ""}</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-5">
              <TabsContent value="detalhes" className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground">Valor</p>
                    <p className="font-semibold text-primary">{formatCurrency(contract.value.toString())}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground">Corretor</p>
                    <p className="font-medium">{contract.realtor.user.name}</p>
                  </div>
                  {contract.signedAt ? (
                    <div className="rounded-xl border border-border/60 p-3">
                      <p className="text-xs text-muted-foreground">Assinado em</p>
                      <p className="font-medium">{formatDateBR(contract.signedAt)}</p>
                    </div>
                  ) : null}
                  {contract.proposal ? (
                    <div className="rounded-xl border border-border/60 p-3">
                      <p className="text-xs text-muted-foreground">Proposta vinculada</p>
                      <p className="font-medium">{formatCurrency(contract.proposal.value.toString())}</p>
                    </div>
                  ) : null}
                </div>

                {contract.fileUrl ? (
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Arquivo do cadastro</p>
                    <a
                      href={contract.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-border/60 p-3 text-primary hover:bg-secondary/40"
                    >
                      <Paperclip className="size-4 shrink-0" />
                      <span className="flex-1 truncate">Ver arquivo</span>
                      <ExternalLink className="size-3.5 shrink-0" />
                    </a>
                  </div>
                ) : null}
              </TabsContent>

              <TabsContent value="anexos" className="space-y-4">
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="size-3.5" />
                    {isUploading ? "Enviando..." : "Anexar arquivo"}
                  </Button>
                </div>

                {contract.attachments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum arquivo anexado ainda.</p>
                ) : (
                  <ul className="space-y-2">
                    {contract.attachments.map((attachment) => (
                      <li
                        key={attachment.id}
                        className="flex items-center gap-2 rounded-xl border border-border/60 p-3 text-sm"
                      >
                        <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 truncate text-primary hover:underline"
                        >
                          {attachment.name}
                        </a>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDateBR(attachment.createdAt)}
                        </span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              type="button"
                              disabled={isPending}
                              className="shrink-0 text-muted-foreground hover:text-destructive"
                              aria-label="Remover anexo"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover este anexo?</AlertDialogTitle>
                              <AlertDialogDescription>
                                &ldquo;{attachment.name}&rdquo; será removido do contrato. Essa ação não pode ser
                                desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel />
                              <AlertDialogAction onClick={() => handleDeleteAttachment(attachment.id)}>
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}
    </Sheet>
  )
}
