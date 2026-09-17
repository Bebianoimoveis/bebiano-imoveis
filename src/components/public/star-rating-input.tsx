"use client"

import { useState } from "react"
import { Star } from "lucide-react"

import { cn } from "@/lib/utils"

export function StarRatingInput({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const displayValue = hovered ?? value

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} ${star === 1 ? "estrela" : "estrelas"}`}
          onMouseEnter={() => setHovered(star)}
          onClick={() => onChange(star)}
          className="p-1 transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              "size-8 transition-colors",
              star <= displayValue ? "fill-gold text-gold" : "fill-transparent text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  )
}
