"use client"

import { useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MoreHorizontal } from "lucide-react"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { updateLeadStage } from "@/modules/lead/actions"
import {
  LEAD_STAGE_LABELS,
  LEAD_STAGE_ORDER,
} from "@/components/admin/leads/lead-stage"
import type { LeadListItem } from "@/modules/lead/repository"
import type { LeadStage } from "@/generated/prisma/client"

export function LeadCard({ lead }: { lead: LeadListItem }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleMove(stage: LeadStage) {
    startTransition(async () => {
      try {
        await updateLeadStage(lead.id, stage)
        toast.success("Lead movido.")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao mover lead.")
      }
    })
  }

  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/admin/leads/${lead.id}`}
          className="font-medium hover:underline"
        >
          {lead.name}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-6" disabled={isPending}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {LEAD_STAGE_ORDER.filter((stage) => stage !== lead.stage).map((stage) => (
              <DropdownMenuItem key={stage} onClick={() => handleMove(stage)}>
                Mover para {LEAD_STAGE_LABELS[stage]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="text-xs text-muted-foreground">{lead.phone}</p>

      {lead.property ? (
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {lead.property.code} · {lead.property.title}
        </p>
      ) : null}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{lead.realtor?.user.name ?? "Sem corretor"}</span>
        {lead.nextActionAt ? (
          <span>{new Date(lead.nextActionAt).toLocaleDateString("pt-BR")}</span>
        ) : null}
      </div>
    </div>
  )
}
