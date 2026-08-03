"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { ImageOff, Mail, Phone } from "lucide-react"

import { Sheet } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon"
import {
  SubmissionStatusBadge,
  type SubmissionStatus,
} from "@/components/admin/submissions/submission-status-badge"
import {
  getAdminSubmission,
  updateSubmissionStatus,
  linkSubmissionToProperty,
} from "@/modules/submission/actions"
import { formatCurrency } from "@/lib/format"
import type { SubmissionWithRefs } from "@/modules/submission/repository"

type PropertyOption = { id: string; code: string; title: string }

export function SubmissionDetailPanel({
  submissionId,
  onClose,
  properties,
}: {
  submissionId: string | null
  onClose: () => void
  properties: PropertyOption[]
}) {
  const router = useRouter()
  const [submission, setSubmission] = useState<SubmissionWithRefs | null>(null)
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [selectedPropertyId, setSelectedPropertyId] = useState("")

  useEffect(() => {
    if (!submissionId) {
      setSubmission(null)
      return
    }
    setLoading(true)
    getAdminSubmission(submissionId)
      .then(setSubmission)
      .finally(() => setLoading(false))
  }, [submissionId])

  function refetch() {
    if (!submissionId) return
    getAdminSubmission(submissionId).then(setSubmission)
  }

  function handleStatus(status: SubmissionStatus) {
    if (!submissionId) return
    startTransition(async () => {
      try {
        await updateSubmissionStatus(submissionId, status)
        toast.success("Status atualizado.")
        refetch()
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao atualizar.")
      }
    })
  }

  function handleLinkProperty() {
    if (!submissionId || !selectedPropertyId) return
    startTransition(async () => {
      try {
        await linkSubmissionToProperty(submissionId, selectedPropertyId)
        toast.success("Captação vinculada ao imóvel e marcada como convertida.")
        refetch()
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao vincular imóvel.")
      }
    })
  }

  return (
    <Sheet open={!!submissionId} onOpenChange={(open) => !open && onClose()} side="right" className="w-full max-w-xl">
      {loading || !submission ? (
        <div className="space-y-4 p-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <div className="border-b border-border/60 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-heading text-lg font-semibold">{submission.name}</p>
                <p className="text-sm text-muted-foreground">
                  {submission.type?.name ?? "Tipo não informado"}
                  {submission.city ? ` · ${submission.city.name} - ${submission.city.state}` : ""}
                </p>
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
              <SubmissionStatusBadge status={submission.status} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <a href={`tel:${submission.phone}`}>
                  <Phone className="size-3.5" /> Ligar
                </a>
              </Button>
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <a
                  href={`https://wa.me/${submission.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon className="size-3.5" /> WhatsApp
                </a>
              </Button>
              {submission.email ? (
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <a href={`mailto:${submission.email}`}>
                    <Mail className="size-3.5" /> E-mail
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {submission.status !== "CONVERTED" && submission.status !== "DECLINED" ? (
              <div className="flex flex-wrap gap-2">
                {submission.status === "NEW" ? (
                  <Button size="sm" disabled={isPending} onClick={() => handleStatus("CONTACTED")}>
                    Marcar como contactado
                  </Button>
                ) : null}
                <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleStatus("DECLINED")}>
                  Marcar como recusado
                </Button>
              </div>
            ) : null}

            {submission.status !== "CONVERTED" ? (
              <div className="space-y-2 rounded-xl border border-gold/30 bg-gold/5 p-4">
                <p className="text-sm font-medium">Criar anúncio a partir desta captação</p>
                <p className="text-xs text-muted-foreground">
                  Abre o formulário de novo imóvel já pré-preenchido com os dados enviados pelo cliente.
                </p>
                <Button asChild size="sm">
                  <Link href={`/admin/imoveis/novo?fromSubmissionId=${submission.id}`}>Criar anúncio</Link>
                </Button>
              </div>
            ) : null}

            {submission.status !== "CONVERTED" ? (
              <div className="space-y-2 rounded-xl border border-border/60 p-4">
                <p className="text-sm font-medium">Vincular a um imóvel já cadastrado</p>
                <p className="text-xs text-muted-foreground">
                  Depois de criar o anúncio, selecione-o aqui para marcar esta captação como convertida.
                </p>
                <div className="flex gap-2">
                  <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o imóvel..." />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.code} · {property.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" disabled={isPending || !selectedPropertyId} onClick={handleLinkProperty}>
                    Vincular
                  </Button>
                </div>
              </div>
            ) : submission.convertedProperty ? (
              <div className="rounded-xl border border-emerald-600/30 bg-emerald-600/5 p-4 text-sm">
                Convertido no imóvel <strong>{submission.convertedProperty.code}</strong>.
              </div>
            ) : null}

            {submission.askingPrice ? (
              <div className="rounded-xl border border-border/60 p-3 text-sm">
                <p className="text-xs text-muted-foreground">Valor pretendido</p>
                <p className="font-semibold text-primary">{formatCurrency(submission.askingPrice.toString())}</p>
              </div>
            ) : null}

            {submission.neighborhoodText ? (
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">Bairro informado (texto livre)</p>
                <p className="font-medium">{submission.neighborhoodText}</p>
              </div>
            ) : null}

            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">Descrição</p>
              <p>{submission.description}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Fotos ({submission.images.length})</p>
              {submission.images.length === 0 ? (
                <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground">
                  <ImageOff className="size-5" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {submission.images.map((image) => (
                    <div key={image.id} className="relative aspect-4/3 overflow-hidden rounded-lg bg-secondary">
                      <Image src={image.url} alt="" fill className="object-cover" sizes="150px" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Sheet>
  )
}
