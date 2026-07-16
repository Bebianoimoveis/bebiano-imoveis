"use client"

import { useState } from "react"
import Image from "next/image"
import { ImageOff } from "lucide-react"

type GalleryImage = { id: string; url: string }

export function PropertyGallery({
  images,
  title,
}: {
  images: GalleryImage[]
  title: string
}) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (images.length === 0) {
    return (
      <div className="flex aspect-16/9 items-center justify-center rounded-xl border border-border/60 bg-muted text-muted-foreground">
        <ImageOff className="size-10" />
      </div>
    )
  }

  const active = images[activeIndex]

  return (
    <div className="space-y-3">
      <div className="relative aspect-16/9 overflow-hidden rounded-xl border border-border/60 bg-muted">
        <Image
          src={active.url}
          alt={title}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 800px"
        />
      </div>

      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative size-16 shrink-0 overflow-hidden rounded-lg border transition-colors ${
                index === activeIndex ? "border-primary" : "border-transparent"
              }`}
            >
              <Image src={image.url} alt="" fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
