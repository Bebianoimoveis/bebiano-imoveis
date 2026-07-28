"use client"

import { Heart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useFavorites } from "@/hooks/use-favorites"
import { cn } from "@/lib/utils"

export function FavoriteButton({
  propertyId,
  className,
  variant = "icon",
}: {
  propertyId: string
  className?: string
  variant?: "icon" | "button"
}) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const active = isFavorite(propertyId)
  const label = active ? "Remover dos favoritos" : "Adicionar aos favoritos"

  if (variant === "button") {
    return (
      <Button
        type="button"
        variant="outline"
        aria-pressed={active}
        onClick={() => toggleFavorite(propertyId)}
        className={className}
      >
        <Heart className={cn("size-4", active && "fill-primary text-primary")} />
        {active ? "Favoritado" : "Favoritar"}
      </Button>
    )
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        // Os cards são <Link>; sem isso o clique no coração navegaria
        // pro imóvel em vez de só favoritar.
        e.preventDefault()
        e.stopPropagation()
        toggleFavorite(propertyId)
      }}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex size-9 items-center justify-center rounded-full border border-white/30 bg-white/90 text-foreground shadow-sm backdrop-blur-sm transition-all hover:scale-105",
        className
      )}
    >
      <Heart
        className={cn(
          "size-4 transition-colors",
          active ? "fill-primary text-primary" : "text-foreground/70"
        )}
      />
    </button>
  )
}
