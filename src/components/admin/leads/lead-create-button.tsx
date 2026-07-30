"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { LeadCreateSheet } from "@/components/admin/leads/lead-create-sheet"
import type { LeadStage } from "@/generated/prisma/client"

type RealtorOption = { id: string; user: { name: string } }

// Botão auto-contido pro cabeçalho — não depende do estado do
// LeadCrmBoard (que já cuida do "Adicionar Lead" de cada coluna vazia e
// do atalho Ctrl+N). Os dois caminhos abrem a mesma tela, só não
// compartilham a mesma instância do Sheet.
export function LeadCreateButton({ realtors }: { realtors: RealtorOption[] }) {
  const [stage, setStage] = useState<LeadStage | null>(null)

  return (
    <>
      <Button className="gap-1.5" onClick={() => setStage("NEW")}>
        <Plus className="size-4" />
        Novo Lead
      </Button>
      <LeadCreateSheet
        stage={stage}
        onOpenChange={(open) => !open && setStage(null)}
        realtors={realtors}
      />
    </>
  )
}
