"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertTriangle, CheckCircle2, FileSignature, FileText, Loader2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  addContractAttachment,
  convertProposalToContract,
  updateContractStatus,
  type ProposalConversionResult,
} from "@/modules/contract/actions"
import { createContractFileUploadSignature } from "@/modules/upload/actions"
import { uploadContractFile } from "@/modules/upload/client"
import { fileViewUrl } from "@/lib/file-url"
import { formatCurrency } from "@/lib/format"

// Depois de enviada ao cliente (e não recusada/cancelada), a proposta
// pode virar contrato.
export function canConvertProposal(status: string) {
  return ["SENT", "VIEWED", "NEGOTIATING", "ACCEPTED", "SIGNING", "COMPLETED"].includes(status)
}

export type ConversionSummary = {
  clientName: string
  propertyLabel: string
  value: number
  realtorName: string
}

// Proposta aprovada → contrato em um clique. Primeiro confirma os dados;
// depois de criado, mostra o PDF da proposta já anexado e pede a
// assinatura do cliente (anexar o contrato assinado), que pode marcar o
// contrato como Ativo na mesma hora.
export function ConvertToContractDialog({
  proposalId,
  summary,
  hasContract,
  open,
  onOpenChange,
  onConverted,
}: {
  proposalId: string
  summary: ConversionSummary
  hasContract: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onConverted?: () => void
}) {
  const router = useRouter()
  const [result, setResult] = useState<ProposalConversionResult | null>(null)
  const [working, setWorking] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [markSigned, setMarkSigned] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  // Ao abrir pra uma proposta que já tem contrato, busca o contrato (a
  // conversão é idempotente) e vai direto pra etapa de anexar.
  useEffect(() => {
    if (!open || !hasContract || result) return
    let cancelled = false
    convertProposalToContract(proposalId)
      .then((response) => {
        if (cancelled) return
        if ("error" in response) toast.error(response.error)
        else setResult(response)
      })
      .catch(() => toast.error("Erro ao carregar o contrato."))
    return () => {
      cancelled = true
    }
  }, [open, hasContract, proposalId, result])

  function handleOpenChange(next: boolean) {
    onOpenChange(next)
    if (!next) setResult(null)
  }

  async function convert() {
    setWorking(true)
    try {
      const response = await convertProposalToContract(proposalId)
      if ("error" in response) {
        toast.error(response.error)
        return
      }
      setResult(response)
      if (!response.alreadyExisted) {
        toast.success("Contrato criado a partir da proposta.")
        onConverted?.()
        router.refresh()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao converter em contrato.")
    } finally {
      setWorking(false)
    }
  }

  async function handleSignedFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !result) return
    setUploading(true)
    try {
      const signature = await createContractFileUploadSignature()
      const uploaded = await uploadContractFile(file, signature)
      await addContractAttachment(result.contractId, uploaded)
      let status = result.contractStatus
      if (markSigned && status === "DRAFT") {
        await updateContractStatus(result.contractId, "ACTIVE")
        status = "ACTIVE"
      }
      setResult({
        ...result,
        contractStatus: status,
        attachments: [...result.attachments, { id: `${Date.now()}`, name: uploaded.name, url: uploaded.url }],
      })
      toast.success(status === "ACTIVE" && markSigned ? "Assinatura anexada e contrato marcado como assinado." : "Arquivo anexado ao contrato.")
      onConverted?.()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao anexar o arquivo.")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{result ? "Contrato da proposta" : "Converter em contrato"}</DialogTitle>
        </DialogHeader>

        {!result ? (
          hasContract ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                O cliente aprovou? O contrato é criado com os dados abaixo e o PDF da proposta vai anexado nele.
                Em seguida você já pode anexar o contrato assinado.
              </p>
              <div className="space-y-2 rounded-xl border border-border/60 p-4 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Cliente</span>
                  <span className="text-right font-medium">{summary.clientName}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Imóvel</span>
                  <span className="text-right font-medium">{summary.propertyLabel}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Corretor</span>
                  <span className="text-right font-medium">{summary.realtorName}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="text-right font-semibold">{formatCurrency(summary.value)}</span>
                </div>
              </div>
              <Button className="w-full gap-1.5" onClick={convert} disabled={working}>
                {working ? <Loader2 className="size-4 animate-spin" /> : <FileSignature className="size-4" />}
                {working ? "Criando contrato e anexando a proposta..." : "Converter em contrato"}
              </Button>
            </div>
          )
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="font-medium">
                  {result.alreadyExisted ? "Esta proposta já virou contrato." : "Contrato criado!"}
                </p>
                <p className="text-muted-foreground">
                  {summary.clientName} · {formatCurrency(summary.value)}
                </p>
              </div>
            </div>

            {!result.proposalPdfAttached && !result.alreadyExisted ? (
              <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                Não consegui anexar o PDF da proposta automaticamente. Baixe pelo botão &ldquo;PDF&rdquo; da proposta e
                anexe no contrato.
              </div>
            ) : null}

            <div className="space-y-1.5">
              <p className="text-sm font-medium">Arquivos do contrato</p>
              {result.attachments.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum arquivo anexado ainda.</p>
              ) : (
                result.attachments.map((file) => (
                  <a
                    key={file.id}
                    href={fileViewUrl(file.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm transition-colors hover:border-primary"
                  >
                    <FileText className="size-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate">{file.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">Abrir</span>
                  </a>
                ))
              )}
            </div>

            {result.canAttach ? (
              <div className="space-y-3 rounded-xl border border-gold/30 bg-gold/5 p-4">
                <div>
                  <p className="text-sm font-medium">Anexar contrato assinado pelo cliente</p>
                  <p className="text-xs text-muted-foreground">PDF ou foto (JPG/PNG) do contrato com a assinatura.</p>
                </div>
                {result.contractStatus === "DRAFT" ? (
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={markSigned} onCheckedChange={(v) => setMarkSigned(v === true)} />
                    Marcar o contrato como assinado (Ativo) ao anexar
                  </label>
                ) : null}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleSignedFile}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-1.5"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                  {uploading ? "Enviando..." : "Escolher arquivo assinado"}
                </Button>
              </div>
            ) : (
              <p className="rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
                O contrato assinado é anexado pela gestão na aba Contratos.
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push(`/admin/contratos?contrato=${result.contractId}`)}
              >
                Abrir na aba Contratos
              </Button>
              <Button className="flex-1" onClick={() => handleOpenChange(false)}>
                Concluir
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
