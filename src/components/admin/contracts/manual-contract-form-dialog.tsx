"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Paperclip, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/components/ui/currency-input"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CONTRACT_STATUS_LABELS } from "@/components/admin/contracts/contract-status-badge"
import { createManualContract } from "@/modules/contract/actions"
import { findPropertyByCode } from "@/modules/property/actions"
import { createContractFileUploadSignature } from "@/modules/upload/actions"
import { uploadContractFile } from "@/modules/upload/client"
import type { ContractStatus } from "@/generated/prisma/client"

type RealtorOption = { id: string; user: { name: string } }
type PropertyOption = { id: string; code: string; title: string }

// Cadastro direto de contrato sem passar por proposta — negócio fechado
// fora do sistema, ou contrato antigo sendo migrado pra cá, anexando o
// arquivo assinado na hora.
export function ManualContractFormDialog({
  clientId,
  realtors,
  trigger,
  defaultRealtorId,
}: {
  clientId: string
  realtors: RealtorOption[]
  trigger: React.ReactNode
  defaultRealtorId?: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const [propertyCode, setPropertyCode] = useState("")
  const [property, setProperty] = useState<PropertyOption | null>(null)
  const [propertyError, setPropertyError] = useState<string | null>(null)
  const [realtorId, setRealtorId] = useState(defaultRealtorId ?? "")
  const [value, setValue] = useState<number | undefined>(undefined)
  const [status, setStatus] = useState<ContractStatus>("DRAFT")
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined)
  const [fileName, setFileName] = useState<string | undefined>(undefined)

  function reset() {
    setPropertyCode("")
    setProperty(null)
    setPropertyError(null)
    setRealtorId(defaultRealtorId ?? "")
    setValue(undefined)
    setStatus("DRAFT")
    setFileUrl(undefined)
    setFileName(undefined)
  }

  async function handleLookupProperty() {
    setPropertyError(null)
    const found = await findPropertyByCode(propertyCode.trim())
    if (!found) {
      setPropertyError("Imóvel não encontrado com esse código.")
      setProperty(null)
      return
    }
    setProperty({ id: found.id, code: found.code, title: found.title })
    if (!value) setValue(Number(found.price))
    if (!realtorId && found.realtorId) setRealtorId(found.realtorId)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const signature = await createContractFileUploadSignature()
      const uploaded = await uploadContractFile(file, signature)
      setFileUrl(uploaded.url)
      setFileName(uploaded.name)
      toast.success("Contrato anexado.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar o contrato.")
    } finally {
      setIsUploading(false)
      e.target.value = ""
    }
  }

  async function handleSubmit() {
    if (!property || !realtorId || !value) {
      toast.error("Informe imóvel, corretor e valor.")
      return
    }

    setIsSubmitting(true)
    try {
      await createManualContract({
        clientId,
        propertyId: property.id,
        realtorId,
        value,
        status,
        fileUrl,
      })
      toast.success("Contrato cadastrado.")
      setOpen(false)
      reset()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao cadastrar contrato.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar contrato</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Imóvel</Label>
            {property ? (
              <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
                <span>
                  {property.code} · {property.title}
                </span>
                <button type="button" onClick={() => setProperty(null)} aria-label="Remover imóvel">
                  <X className="size-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={propertyCode}
                  onChange={(e) => setPropertyCode(e.target.value)}
                  placeholder="Código do imóvel, ex: BB-1024"
                />
                <Button type="button" variant="outline" onClick={handleLookupProperty}>
                  Buscar
                </Button>
              </div>
            )}
            {propertyError ? <p className="text-sm text-destructive">{propertyError}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              <Label>Valor</Label>
              <CurrencyInput value={value} onChange={setValue} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ContractStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CONTRACT_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Contrato assinado (opcional)</Label>
            {fileUrl ? (
              <div className="flex items-center gap-2 rounded-lg border border-border/60 p-2 text-sm">
                <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-primary">
                  {fileName ?? "Ver arquivo"}
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setFileUrl(undefined)
                    setFileName(undefined)
                  }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} disabled={isUploading} />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting || isUploading}>
            {isSubmitting ? "Salvando..." : "Cadastrar contrato"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
