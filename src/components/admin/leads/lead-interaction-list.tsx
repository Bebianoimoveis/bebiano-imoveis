"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Phone, MessageCircle, Mail, Home, StickyNote, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
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
import { updateLeadInteraction, deleteLeadInteraction } from "@/modules/lead/actions"
import { formatDateTimeBR } from "@/lib/format"
import type { LeadDetail } from "@/modules/lead/repository"

const TYPE_ICONS = {
  CALL: Phone,
  WHATSAPP: MessageCircle,
  EMAIL: Mail,
  VISIT: Home,
  NOTE: StickyNote,
} as const

const TYPE_LABELS: Record<string, string> = {
  CALL: "Ligação",
  WHATSAPP: "WhatsApp",
  EMAIL: "E-mail",
  VISIT: "Visita",
  NOTE: "Anotação",
}

export function LeadInteractionList({
  leadId,
  interactions,
  onSuccess,
}: {
  leadId: string
  interactions: LeadDetail["interactions"]
  // Painéis que buscam o lead pra um estado local (ex: o Sheet de
  // detalhe) precisam refazer essa busca própria — router.refresh() só
  // atualiza dado vindo de Server Component, não estado de client.
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState("")

  function startEdit(id: string, currentDescription: string) {
    setEditingId(id)
    setDraft(currentDescription)
  }

  function cancelEdit() {
    setEditingId(null)
    setDraft("")
  }

  function saveEdit(id: string) {
    startTransition(async () => {
      try {
        await updateLeadInteraction(leadId, id, draft)
        toast.success("Interação atualizada.")
        setEditingId(null)
        router.refresh()
        onSuccess?.()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao atualizar interação.")
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteLeadInteraction(leadId, id)
        toast.success("Interação excluída.")
        router.refresh()
        onSuccess?.()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao excluir interação.")
      }
    })
  }

  if (interactions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma interação registrada ainda.
      </p>
    )
  }

  return (
    <ul className="space-y-4">
      {interactions.map((interaction) => {
        const Icon = TYPE_ICONS[interaction.type]
        const isEditing = editingId === interaction.id
        return (
          <li key={interaction.id} className="group flex gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Icon className="size-4" />
            </div>
            <div className="flex-1 space-y-0.5">
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" disabled={isPending} onClick={() => saveEdit(interaction.id)}>
                      Salvar
                    </Button>
                    <Button size="sm" variant="outline" disabled={isPending} onClick={cancelEdit}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm">{interaction.description}</p>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {TYPE_LABELS[interaction.type]} · {interaction.user.name} ·{" "}
                      {formatDateTimeBR(interaction.createdAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => startEdit(interaction.id, interaction.description)}
                      className="opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                      aria-label="Editar interação"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          type="button"
                          className="opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                          aria-label="Excluir interação"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir esta interação?</AlertDialogTitle>
                          <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel />
                          <AlertDialogAction onClick={() => handleDelete(interaction.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </p>
                </>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
