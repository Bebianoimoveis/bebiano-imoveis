import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ProposalStatusBadge } from "@/components/admin/proposals/proposal-status-badge"
import { ProposalRowActions } from "@/components/admin/proposals/proposal-row-actions"
import { formatCurrency } from "@/lib/format"
import type { ProposalListItem } from "@/modules/proposal/repository"

export function ProposalTable({ proposals }: { proposals: ProposalListItem[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Imóvel</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Corretor</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {proposals.map((proposal) => (
            <TableRow key={proposal.id}>
              <TableCell className="max-w-xs truncate text-sm">
                {proposal.property.code} · {proposal.property.title}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {proposal.client.name}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {proposal.realtor.user.name}
              </TableCell>
              <TableCell className="text-sm">
                {formatCurrency(proposal.value.toString())}
              </TableCell>
              <TableCell>
                <ProposalStatusBadge status={proposal.status} />
              </TableCell>
              <TableCell>
                <ProposalRowActions
                  proposalId={proposal.id}
                  status={proposal.status}
                  hasContract={!!proposal.contract}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
