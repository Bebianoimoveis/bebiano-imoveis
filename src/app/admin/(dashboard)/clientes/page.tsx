import { Plus, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/shared/empty-state"
import { ClientFormDialog } from "@/components/admin/clients/client-form-dialog"
import { ClientRowActions } from "@/components/admin/clients/client-row-actions"
import { ClientSearch } from "@/components/admin/clients/client-search"
import { listAdminClients } from "@/modules/client/actions"

type SearchParams = Record<string, string | string[] | undefined>

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const clients = await listAdminClients({
    search: typeof params.search === "string" ? params.search : undefined,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Clientes
          </h1>
          <p className="text-sm text-muted-foreground">
            Cadastro de clientes da imobiliária.
          </p>
        </div>
        <ClientFormDialog
          mode="create"
          trigger={
            <Button>
              <Plus className="size-4" />
              Novo cliente
            </Button>
          }
        />
      </div>

      <ClientSearch />

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente cadastrado"
          description="Clientes convertidos de leads ou cadastrados manualmente aparecem aqui."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {client.phone}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {client.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {client._count.leads}
                  </TableCell>
                  <TableCell>
                    <ClientRowActions
                      clientId={client.id}
                      defaultValues={{
                        name: client.name,
                        phone: client.phone,
                        email: client.email ?? "",
                        notes: client.notes ?? "",
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
