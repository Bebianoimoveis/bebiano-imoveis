import { Plus, LayoutGrid } from "lucide-react"

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
import { PropertyTypeToggleList } from "@/components/admin/segments/property-type-toggle-list"
import { SegmentFormDialog } from "@/components/admin/segments/segment-form-dialog"
import { SegmentDeleteButton } from "@/components/admin/segments/segment-delete-button"
import { SegmentActiveToggle } from "@/components/admin/segments/segment-active-toggle"
import { resolveSegmentIcon } from "@/lib/segment-icons"
import { listPropertyTypes } from "@/modules/taxonomy/actions"
import { listAdminSegments } from "@/modules/segment/actions"

export default async function AdminSegmentsPage() {
  const [propertyTypes, segments] = await Promise.all([
    listPropertyTypes(),
    listAdminSegments(),
  ])

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Segmentos</h1>
        <p className="text-sm text-muted-foreground">
          Controle o que aparece no site público: os tipos de imóvel atendidos e os banners de categoria da home.
        </p>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight">Tipos de imóvel</h2>
          <p className="text-sm text-muted-foreground">
            Desligar um tipo o esconde do site inteiro — busca, filtros, listagens e links diretos — imediatamente.
          </p>
        </div>
        {propertyTypes.length === 0 ? (
          <EmptyState title="Nenhum tipo de imóvel cadastrado" />
        ) : (
          <PropertyTypeToggleList types={propertyTypes} />
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-tight">Banners da home (Segmentos)</h2>
            <p className="text-sm text-muted-foreground">
              Cada segmento ativo vira um banner clicável na home. Crie um novo e deixe-o desativado até decidir
              divulgar (ex: uma futura categoria de Locação).
            </p>
          </div>
          <SegmentFormDialog
            mode="create"
            propertyTypes={propertyTypes}
            trigger={
              <Button>
                <Plus className="size-4" />
                Novo segmento
              </Button>
            }
          />
        </div>

        {segments.length === 0 ? (
          <EmptyState
            icon={LayoutGrid}
            title="Nenhum segmento cadastrado"
            description="Crie o primeiro segmento para exibir um banner de categoria na home."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Ícone</TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="w-52" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {segments.map((segment) => {
                  const Icon = resolveSegmentIcon(segment.icon)
                  return (
                    <TableRow key={segment.id}>
                      <TableCell className="font-medium">{segment.name}</TableCell>
                      <TableCell>
                        <Icon className="size-4 text-gold" />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{segment.order}</TableCell>
                      <TableCell>
                        <SegmentActiveToggle id={segment.id} active={segment.active} />
                      </TableCell>
                      <TableCell className="flex items-center gap-1">
                        <SegmentFormDialog
                          mode="edit"
                          segmentId={segment.id}
                          propertyTypes={propertyTypes}
                          defaultValues={{
                            name: segment.name,
                            active: segment.active,
                            order: segment.order,
                            icon: segment.icon,
                            imageUrl: segment.imageUrl,
                            propertyTypeId: segment.propertyTypeId,
                            purpose: segment.purpose,
                            isLaunch: segment.isLaunch,
                            gatedCommunity: segment.gatedCommunity,
                            minPrice: segment.minPrice ? Number(segment.minPrice) : null,
                          }}
                          trigger={
                            <Button variant="ghost" size="sm">
                              Editar
                            </Button>
                          }
                        />
                        <SegmentDeleteButton id={segment.id} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  )
}
