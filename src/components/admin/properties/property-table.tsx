import Link from "next/link"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PropertyStatusBadge } from "@/components/shared/status-badge"
import { PropertyRowActions } from "@/components/admin/properties/property-row-actions"
import { formatCurrency } from "@/lib/format"
import type { PropertyListItem } from "@/modules/property/repository"

export function PropertyTable({ properties }: { properties: PropertyListItem[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Cidade / Bairro</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Corretor</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {properties.map((property) => (
            <TableRow key={property.id}>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {property.code}
              </TableCell>
              <TableCell className="max-w-xs truncate font-medium">
                <Link
                  href={`/admin/imoveis/${property.id}`}
                  className="hover:underline"
                >
                  {property.title}
                </Link>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {property.neighborhood.name}, {property.city.name}
              </TableCell>
              <TableCell className="text-sm">
                {formatCurrency(property.price.toString())}
              </TableCell>
              <TableCell>
                <PropertyStatusBadge status={property.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {property.realtor?.user.name ?? "—"}
              </TableCell>
              <TableCell>
                <PropertyRowActions propertyId={property.id} status={property.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
