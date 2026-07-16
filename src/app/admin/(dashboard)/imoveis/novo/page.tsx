import { PropertyForm } from "@/components/admin/properties/property-form"
import { listCities, listPropertyTypes, listPropertyFeatures } from "@/modules/taxonomy/actions"
import { listRealtors } from "@/modules/realtor/actions"
import type { PropertyInput } from "@/modules/property/schema"

const defaultValues: PropertyInput = {
  title: "",
  description: "",
  purpose: "SALE",
  typeId: "",
  price: 0,
  cityId: "",
  neighborhoodId: "",
  addressVisibility: "NEIGHBORHOOD_ONLY",
  street: "",
  number: "",
  bedrooms: 0,
  suites: 0,
  bathrooms: 0,
  parkingSpots: 0,
  acceptsFinancing: false,
  acceptsFgts: false,
  furnished: false,
  gatedCommunity: false,
  featured: false,
  videoUrl: "",
  featureIds: [],
}

export default async function NewPropertyPage() {
  const [cities, propertyTypes, features, realtors] = await Promise.all([
    listCities(),
    listPropertyTypes(),
    listPropertyFeatures(),
    listRealtors(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Novo imóvel
        </h1>
        <p className="text-sm text-muted-foreground">
          Cadastre os dados básicos. As fotos podem ser adicionadas após
          salvar o imóvel como rascunho.
        </p>
      </div>

      <PropertyForm
        mode="create"
        defaultValues={defaultValues}
        cities={cities}
        initialNeighborhoods={[]}
        propertyTypes={propertyTypes}
        features={features}
        realtors={realtors}
      />
    </div>
  )
}
