import { notFound } from "next/navigation"

import { PropertyForm } from "@/components/admin/properties/property-form"
import { PropertyStatusBadge } from "@/components/shared/status-badge"
import { PropertyRowActions } from "@/components/admin/properties/property-row-actions"
import { getAdminProperty } from "@/modules/property/actions"
import {
  listCities,
  listNeighborhoods,
  listPropertyTypes,
  listPropertyFeatures,
} from "@/modules/taxonomy/actions"
import { listRealtors } from "@/modules/realtor/actions"
import type { PropertyInput } from "@/modules/property/schema"

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const property = await getAdminProperty(id)
  if (!property) notFound()

  const [cities, propertyTypes, features, realtors, neighborhoods] =
    await Promise.all([
      listCities(),
      listPropertyTypes(),
      listPropertyFeatures(),
      listRealtors(),
      listNeighborhoods(property.cityId),
    ])

  const defaultValues: PropertyInput = {
    title: property.title,
    description: property.description,
    purpose: property.purpose,
    typeId: property.typeId,
    price: Number(property.price),
    condoFee: property.condoFee ? Number(property.condoFee) : undefined,
    iptu: property.iptu ? Number(property.iptu) : undefined,
    cityId: property.cityId,
    neighborhoodId: property.neighborhoodId,
    addressVisibility: property.addressVisibility,
    street: property.street ?? "",
    number: property.number ?? "",
    latitude: property.latitude ? Number(property.latitude) : undefined,
    longitude: property.longitude ? Number(property.longitude) : undefined,
    builtArea: property.builtArea ? Number(property.builtArea) : undefined,
    totalArea: property.totalArea ? Number(property.totalArea) : undefined,
    bedrooms: property.bedrooms,
    suites: property.suites,
    bathrooms: property.bathrooms,
    parkingSpots: property.parkingSpots,
    acceptsFinancing: property.acceptsFinancing,
    acceptsFgts: property.acceptsFgts,
    furnished: property.furnished,
    gatedCommunity: property.gatedCommunity,
    featured: property.featured,
    videoUrl: property.videoUrl ?? "",
    realtorId: property.realtorId ?? undefined,
    featureIds: property.features.map((f) => f.featureId),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {property.title}
            </h1>
            <PropertyStatusBadge status={property.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Código {property.code}
          </p>
        </div>
        <PropertyRowActions propertyId={property.id} status={property.status} />
      </div>

      <PropertyForm
        mode="edit"
        propertyId={property.id}
        defaultValues={defaultValues}
        cities={cities}
        initialNeighborhoods={neighborhoods}
        propertyTypes={propertyTypes}
        features={features}
        realtors={realtors}
        images={property.images}
      />
    </div>
  )
}
