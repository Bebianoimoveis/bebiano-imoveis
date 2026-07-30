"use client"

import { useState } from "react"

import { ProposalTableView } from "@/components/admin/proposals/proposal-table-view"
import { ProposalCardsView } from "@/components/admin/proposals/proposal-cards-view"
import { ProposalListView } from "@/components/admin/proposals/proposal-list-view"
import { ProposalPipeline } from "@/components/admin/proposals/proposal-pipeline"
import { ProposalDetailPanel } from "@/components/admin/proposals/proposal-detail-panel"
import type { ProposalListItem } from "@/modules/proposal/repository"

type RealtorOption = { id: string; user: { name: string } }

export function ProposalDirectory({
  proposals,
  view,
  realtors,
}: {
  proposals: ProposalListItem[]
  view: "table" | "pipeline"
  realtors: RealtorOption[]
}) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <>
      {view === "table" ? (
        <>
          <div className="hidden lg:block">
            <ProposalTableView proposals={proposals} onOpenProposal={setOpenId} />
          </div>
          <div className="hidden md:block lg:hidden">
            <ProposalCardsView proposals={proposals} onOpenProposal={setOpenId} />
          </div>
          <div className="md:hidden">
            <ProposalListView proposals={proposals} onOpenProposal={setOpenId} />
          </div>
        </>
      ) : (
        <>
          <div className="hidden md:block">
            <ProposalPipeline proposals={proposals} onOpenProposal={setOpenId} />
          </div>
          <div className="md:hidden">
            <ProposalListView proposals={proposals} onOpenProposal={setOpenId} />
          </div>
        </>
      )}

      <ProposalDetailPanel proposalId={openId} onClose={() => setOpenId(null)} realtors={realtors} />
    </>
  )
}
