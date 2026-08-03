"use client"

import { useState } from "react"

import { SubmissionStatusBadge } from "@/components/admin/submissions/submission-status-badge"
import { SubmissionDetailPanel } from "@/components/admin/submissions/submission-detail-panel"
import { formatCurrency } from "@/lib/format"
import type { SubmissionWithRefs } from "@/modules/submission/repository"

type PropertyOption = { id: string; code: string; title: string }

export function SubmissionsTable({
  submissions,
  properties,
}: {
  submissions: SubmissionWithRefs[]
  properties: PropertyOption[]
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <>
      <div className="overflow-hidden rounded-[20px] border border-border/60 bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs font-medium text-muted-foreground uppercase">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Telefone</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Cidade</th>
              <th className="px-4 py-3">Valor pretendido</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Data</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr
                key={submission.id}
                onClick={() => setSelectedId(submission.id)}
                className="cursor-pointer border-b border-border/40 transition-colors last:border-0 hover:bg-secondary/20"
              >
                <td className="px-4 py-3 font-medium">{submission.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{submission.phone}</td>
                <td className="px-4 py-3 text-muted-foreground">{submission.type?.name ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {submission.city ? `${submission.city.name} - ${submission.city.state}` : "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {submission.askingPrice ? formatCurrency(submission.askingPrice.toString()) : "—"}
                </td>
                <td className="px-4 py-3">
                  <SubmissionStatusBadge status={submission.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(submission.createdAt).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SubmissionDetailPanel
        submissionId={selectedId}
        onClose={() => setSelectedId(null)}
        properties={properties}
      />
    </>
  )
}
