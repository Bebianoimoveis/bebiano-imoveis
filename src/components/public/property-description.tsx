"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"

export function PropertyDescription({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="space-y-3">
      <h2 className="font-heading text-lg font-semibold">Sobre o imóvel</h2>
      <p
        className={cn(
          "whitespace-pre-line text-muted-foreground",
          !expanded && "line-clamp-4"
        )}
      >
        {description}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="text-sm font-medium text-primary underline underline-offset-2 transition-colors hover:text-primary/80"
      >
        {expanded ? "Ver menos" : "Ver mais"}
      </button>
    </div>
  )
}
