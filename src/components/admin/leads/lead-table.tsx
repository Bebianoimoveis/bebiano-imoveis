import Link from "next/link"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LeadStageBadge } from "@/components/admin/leads/lead-stage-badge"
import type { LeadListItem } from "@/modules/lead/repository"

export function LeadTable({ leads }: { leads: LeadListItem[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Imóvel de interesse</TableHead>
            <TableHead>Corretor</TableHead>
            <TableHead>Etapa</TableHead>
            <TableHead>Próxima ação</TableHead>
            <TableHead>Criado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">
                <Link href={`/admin/leads/${lead.id}`} className="hover:underline">
                  {lead.name}
                </Link>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {lead.phone}
              </TableCell>
              <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                {lead.property ? `${lead.property.code} · ${lead.property.title}` : "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {lead.realtor?.user.name ?? "—"}
              </TableCell>
              <TableCell>
                <LeadStageBadge stage={lead.stage} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {lead.nextActionAt
                  ? new Date(lead.nextActionAt).toLocaleDateString("pt-BR")
                  : "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
