"use client"

import { useEffect, useState } from "react"
import { Heart } from "lucide-react"

import { BackButton } from "@/components/shared/back-button"
import { EmptyState } from "@/components/shared/empty-state"
import { PropertyCard } from "@/components/public/property-card"
import { useFavorites } from "@/hooks/use-favorites"
import { listPropertiesByIds } from "@/modules/property/actions"
import type { PropertyListItem } from "@/modules/property/repository"

export default function FavoritesPage() {
  const { favoriteIds } = useFavorites()
  const [properties, setProperties] = useState<PropertyListItem[] | null>(null)

  useEffect(() => {
    let cancelled = false
    listPropertiesByIds(favoriteIds).then((items) => {
      if (!cancelled) setProperties(items)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favoriteIds.join(",")])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <BackButton className="mb-4" />
      <h1 className="mb-8 font-heading text-2xl font-semibold tracking-tight">
        Meus favoritos
      </h1>

      {properties === null ? null : properties.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Nenhum favorito ainda"
          description="Toque no coração de um imóvel para guardá-lo aqui."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  )
}
