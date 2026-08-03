import { PropertyForm } from "@/components/admin/properties/property-form"
import { listCities, listPropertyTypes, listPropertyFeatures } from "@/modules/taxonomy/actions"
import { listRealtors } from "@/modules/realtor/actions"
import { getAdminSubmission } from "@/modules/submission/actions"
import type { PropertyInput } from "@/modules/property/schema"

const baseDefaultValues: PropertyInput = {
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
  isLaunch: false,
  videoUrl: "",
  featureIds: [],
}

export default async function NewPropertyPage({
  searchParams,
}: {
  searchParams: Promise<{ fromSubmissionId?: string }>
}) {
  const { fromSubmissionId } = await searchParams

  const [cities, propertyTypes, features, realtors, submission] = await Promise.all([
    listCities(),
    listPropertyTypes(),
    listPropertyFeatures(),
    listRealtors(),
    fromSubmissionId ? getAdminSubmission(fromSubmissionId) : Promise.resolve(null),
  ])

  // A captação só guarda um texto livre de bairro (o imóvel ainda não está
  // no nosso catálogo, então não existe Neighborhood/FK) — em vez de
  // perder essa informação, ela entra no início da descrição para a
  // equipe não precisar voltar na captação pra descobrir o bairro.
  const defaultValues: PropertyInput = submission
    ? {
        ...baseDefaultValues,
        description: submission.neighborhoodText
          ? `Bairro informado pelo cliente: ${submission.neighborhoodText}\n\n${submission.description}`
          : submission.description,
        purpose: submission.purpose,
        typeId: submission.typeId ?? "",
        price: submission.askingPrice ? Number(submission.askingPrice) : 0,
        cityId: submission.cityId ?? "",
      }
    : baseDefaultValues

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

      {submission ? (
        <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm">
          Pré-preenchido a partir da captação de <strong>{submission.name}</strong> ({submission.phone}).
          {submission.neighborhoodText ? (
            <> Bairro informado: <strong>{submission.neighborhoodText}</strong> (selecione o bairro correto do catálogo abaixo).</>
          ) : null}
        </div>
      ) : null}

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
