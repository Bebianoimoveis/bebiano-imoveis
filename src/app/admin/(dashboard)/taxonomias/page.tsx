import { Plus } from "lucide-react"

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
import { CityFormDialog } from "@/components/admin/taxonomy/city-form-dialog"
import { PropertyTypeFormDialog } from "@/components/admin/taxonomy/property-type-form-dialog"
import { PropertyFeatureFormDialog } from "@/components/admin/taxonomy/property-feature-form-dialog"
import { NeighborhoodsPanel } from "@/components/admin/taxonomy/neighborhoods-panel"
import {
  listCities,
  listPropertyTypes,
  listPropertyFeatures,
} from "@/modules/taxonomy/actions"

export default async function AdminTaxonomiasPage() {
  const [cities, propertyTypes, features] = await Promise.all([
    listCities(),
    listPropertyTypes(),
    listPropertyFeatures(),
  ])

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Taxonomias</h1>
        <p className="text-sm text-muted-foreground">
          Cidades, bairros, tipos de imóvel e características usados no cadastro de imóveis e nos filtros do site.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold tracking-tight">Cidades</h2>
          <CityFormDialog
            trigger={
              <Button size="sm">
                <Plus className="size-4" /> Nova cidade
              </Button>
            }
          />
        </div>
        {cities.length === 0 ? (
          <EmptyState title="Nenhuma cidade cadastrada" />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cities.map((city) => (
                  <TableRow key={city.id}>
                    <TableCell className="font-medium">{city.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{city.state}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold tracking-tight">Bairros</h2>
        <NeighborhoodsPanel cities={cities} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-tight">Tipos de imóvel</h2>
            <p className="text-sm text-muted-foreground">
              Desligar um tipo o esconde do site inteiro — busca, filtros, listagens e links diretos.
            </p>
          </div>
          <PropertyTypeFormDialog
            trigger={
              <Button size="sm">
                <Plus className="size-4" /> Novo tipo
              </Button>
            }
          />
        </div>
        {propertyTypes.length === 0 ? (
          <EmptyState title="Nenhum tipo de imóvel cadastrado" />
        ) : (
          <PropertyTypeToggleList types={propertyTypes} />
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold tracking-tight">Características</h2>
          <PropertyFeatureFormDialog
            trigger={
              <Button size="sm">
                <Plus className="size-4" /> Nova característica
              </Button>
            }
          />
        </div>
        {features.length === 0 ? (
          <EmptyState title="Nenhuma característica cadastrada" />
        ) : (
          <div className="flex flex-wrap gap-2">
            {features.map((feature) => (
              <span
                key={feature.id}
                className="rounded-full border border-border/60 bg-secondary/40 px-3 py-1.5 text-sm"
              >
                {feature.name}
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
