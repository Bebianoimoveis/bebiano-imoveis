import Image from "next/image"
import Link from "next/link"
import { Plus, User, Users2 } from "lucide-react"

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
import { RealtorFormDialog } from "@/components/admin/realtors/realtor-form-dialog"
import { RealtorActiveToggle } from "@/components/admin/realtors/realtor-active-toggle"
import { listAdminRealtors } from "@/modules/realtor/actions"

export default async function AdminRealtorsPage() {
  const realtors = await listAdminRealtors()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Corretores
          </h1>
          <p className="text-sm text-muted-foreground">
            Cadastre corretores para que apareçam na seção "Nossa Equipe" do site público e
            tenham acesso ao painel.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/corretores/links">Links de divulgação</Link>
          </Button>
          <RealtorFormDialog
            mode="create"
            trigger={
              <Button>
                <Plus className="size-4" />
                Novo corretor
              </Button>
            }
          />
        </div>
      </div>

      {realtors.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="Nenhum corretor cadastrado"
          description="Cadastre o primeiro corretor para exibir na equipe do site e liberar o acesso dele ao painel."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Corretor</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>CRECI</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {realtors.map((realtor) => (
                <TableRow key={realtor.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-muted-foreground">
                        {realtor.photoUrl ? (
                          <Image src={realtor.photoUrl} alt={realtor.user.name} fill className="object-cover" sizes="36px" />
                        ) : (
                          <User className="size-4" />
                        )}
                      </div>
                      {realtor.user.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{realtor.user.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{realtor.phone}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{realtor.creci ?? "—"}</TableCell>
                  <TableCell>
                    <RealtorActiveToggle id={realtor.id} active={realtor.active} />
                  </TableCell>
                  <TableCell>
                    <RealtorFormDialog
                      mode="edit"
                      realtorId={realtor.id}
                      defaultValues={{
                        name: realtor.user.name,
                        email: realtor.user.email,
                        phone: realtor.phone,
                        creci: realtor.creci ?? "",
                        bio: realtor.bio ?? "",
                        photoUrl: realtor.photoUrl ?? "",
                      }}
                      trigger={
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      }
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
