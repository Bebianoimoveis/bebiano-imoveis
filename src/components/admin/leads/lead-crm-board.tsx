"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { toast } from "sonner"

import { LeadKanbanColumn } from "@/components/admin/leads/lead-kanban-column"
import { LeadMobileList } from "@/components/admin/leads/lead-mobile-list"
import { LeadDetailPanel } from "@/components/admin/leads/lead-detail-panel"
import { LeadCreateSheet } from "@/components/admin/leads/lead-create-sheet"
import { LEAD_STAGE_ORDER } from "@/components/admin/leads/lead-stage"
import { updateLeadStage } from "@/modules/lead/actions"
import type { LeadListItem } from "@/modules/lead/repository"
import type { LeadStage } from "@/generated/prisma/client"

type RealtorOption = { id: string; user: { name: string } }

export function LeadCrmBoard({
  leads: initialLeads,
  realtors,
}: {
  leads: LeadListItem[]
  realtors: RealtorOption[]
}) {
  const router = useRouter()
  const [leads, setLeads] = useState(initialLeads)
  const [openLeadId, setOpenLeadId] = useState<string | null>(null)
  const [createStage, setCreateStage] = useState<LeadStage | null>(null)

  useEffect(() => setLeads(initialLeads), [initialLeads])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const leadId = String(active.id)
    const newStage = over.id as LeadStage
    const lead = leads.find((item) => item.id === leadId)
    if (!lead || lead.stage === newStage) return

    // Otimista: já move na tela, some/reverte se a Server Action falhar.
    setLeads((prev) =>
      prev.map((item) => (item.id === leadId ? { ...item, stage: newStage } : item))
    )

    updateLeadStage(leadId, newStage)
      .then(() => {
        toast.success("Lead movido.")
        router.refresh()
      })
      .catch((error) => {
        setLeads((prev) =>
          prev.map((item) => (item.id === leadId ? { ...item, stage: lead.stage } : item))
        )
        toast.error(error instanceof Error ? error.message : "Erro ao mover lead.")
      })
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault()
        setCreateStage("NEW")
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="hidden gap-4 overflow-x-auto pb-4 md:flex">
          {LEAD_STAGE_ORDER.map((stage) => (
            <LeadKanbanColumn
              key={stage}
              stage={stage}
              leads={leads.filter((lead) => lead.stage === stage)}
              onOpenLead={setOpenLeadId}
              onAddLead={setCreateStage}
            />
          ))}
        </div>
      </DndContext>

      <div className="md:hidden">
        <LeadMobileList leads={leads} onOpenLead={setOpenLeadId} />
      </div>

      <LeadDetailPanel
        leadId={openLeadId}
        onClose={() => setOpenLeadId(null)}
        realtors={realtors}
      />

      <LeadCreateSheet
        stage={createStage}
        onOpenChange={(open) => !open && setCreateStage(null)}
        realtors={realtors}
      />
    </>
  )
}
