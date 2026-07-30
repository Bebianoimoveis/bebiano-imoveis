"use client"

import { useEffect, useState } from "react"
import {
  DndContext,
  MeasuringStrategy,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import {
  PROPOSAL_STATUS_DOT,
  PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUS_ORDER,
} from "@/components/admin/proposals/proposal-status-badge"
import { ClientAvatar } from "@/components/admin/clients/client-avatar"
import { updateProposalStatus } from "@/modules/proposal/actions"
import { formatCurrency } from "@/lib/format"
import type { ProposalListItem } from "@/modules/proposal/repository"
import type { ProposalStatus } from "@/generated/prisma/client"

function PipelineCard({
  proposal,
  onOpen,
}: {
  proposal: ProposalListItem
  onOpen: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: proposal.id })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => !isDragging && onOpen(proposal.id)}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "w-full cursor-grab touch-none space-y-2 rounded-xl border border-border/60 bg-card p-3 text-left text-sm shadow-sm transition-shadow select-none hover:shadow-md active:cursor-grabbing",
        isDragging && "z-20 opacity-70 shadow-xl"
      )}
    >
      <div className="flex items-center gap-2">
        <ClientAvatar name={proposal.client.name} size="sm" />
        <span className="truncate font-medium">{proposal.client.name}</span>
      </div>
      <p className="truncate text-xs text-muted-foreground">{proposal.property.title}</p>
      <p className="text-sm font-semibold text-primary">{formatCurrency(proposal.value.toString())}</p>
      <p className="text-xs text-muted-foreground">{proposal.realtor.user.name}</p>
    </div>
  )
}

function PipelineColumn({
  status,
  proposals,
  onOpen,
}: {
  status: ProposalStatus
  proposals: ProposalListItem[]
  onOpen: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const total = proposals.reduce((sum, p) => sum + Number(p.value), 0)

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-[20px] border border-border/60 bg-secondary/20 p-3 transition-colors",
        isOver && "ring-2 ring-primary/40 bg-primary/5"
      )}
    >
      <div className="mb-1 flex items-center gap-2 px-1">
        <span className={cn("size-2 rounded-full", PROPOSAL_STATUS_DOT[status])} />
        <p className="text-sm font-semibold">{PROPOSAL_STATUS_LABELS[status]}</p>
        <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-secondary text-[11px] font-medium text-muted-foreground">
          {proposals.length}
        </span>
      </div>
      {total > 0 ? (
        <p className="mb-3 px-1 text-xs text-muted-foreground">{formatCurrency(total)}</p>
      ) : (
        <div className="mb-3" />
      )}
      <div className="max-h-[calc(100vh-28rem)] space-y-2 overflow-y-auto">
        {proposals.map((proposal) => (
          <PipelineCard key={proposal.id} proposal={proposal} onOpen={onOpen} />
        ))}
      </div>
    </div>
  )
}

export function ProposalPipeline({
  proposals: initialProposals,
  onOpenProposal,
}: {
  proposals: ProposalListItem[]
  onOpenProposal: (id: string) => void
}) {
  const router = useRouter()
  const [proposals, setProposals] = useState(initialProposals)
  useEffect(() => setProposals(initialProposals), [initialProposals])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const measuring = { droppable: { strategy: MeasuringStrategy.Always } }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const newStatus = over.id as ProposalStatus
    const proposal = proposals.find((p) => p.id === active.id)
    if (!proposal || proposal.status === newStatus) return

    const previousStatus = proposal.status
    setProposals((prev) => prev.map((p) => (p.id === proposal.id ? { ...p, status: newStatus } : p)))

    updateProposalStatus(proposal.id, newStatus)
      .then(() => {
        toast.success("Status atualizado.")
        router.refresh()
      })
      .catch((error) => {
        setProposals((prev) => prev.map((p) => (p.id === proposal.id ? { ...p, status: previousStatus } : p)))
        toast.error(error instanceof Error ? error.message : "Erro ao mover.")
      })
  }

  return (
    <DndContext sensors={sensors} autoScroll={false} measuring={measuring} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PROPOSAL_STATUS_ORDER.map((status) => (
          <PipelineColumn
            key={status}
            status={status}
            proposals={proposals.filter((p) => p.status === status)}
            onOpen={onOpenProposal}
          />
        ))}
      </div>
    </DndContext>
  )
}
