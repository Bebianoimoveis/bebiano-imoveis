"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion } from "motion/react"
import { ChevronLeft, ChevronRight, ImageOff, X } from "lucide-react"

type GalleryImage = { id: string; url: string }

export function PropertyGallery({
  images,
  title,
}: {
  images: GalleryImage[]
  title: string
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  const goToPrevious = useCallback(() => {
    setActiveIndex((index) => (index - 1 + images.length) % images.length)
  }, [images.length])

  const goToNext = useCallback(() => {
    setActiveIndex((index) => (index + 1) % images.length)
  }, [images.length])

  // Setinhas do teclado funcionam com o lightbox aberto, sem precisar
  // clicar exatamente nos botões — comportamento padrão de qualquer
  // visualizador de imagens.
  useEffect(() => {
    if (!isLightboxOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") goToPrevious()
      else if (event.key === "ArrowRight") goToNext()
      else if (event.key === "Escape") setIsLightboxOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isLightboxOpen, goToPrevious, goToNext])

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
      <div className="group relative aspect-16/9 w-full overflow-hidden rounded-xl border border-border/60 bg-muted">
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          aria-label="Ampliar foto"
          className="absolute inset-0 z-0 cursor-zoom-in overflow-hidden"
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={active.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Image
                src={active.url}
                alt={title}
                fill
                priority
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 800px"
              />
            </motion.div>
          </AnimatePresence>
        </button>

        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                goToPrevious()
              }}
              aria-label="Foto anterior"
              className="absolute top-1/2 left-3 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/8 text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-white/15"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                goToNext()
              }}
              aria-label="Próxima foto"
              className="absolute top-1/2 right-3 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/8 text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-white/15"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        ) : null}
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

      <AnimatePresence>
        {isLightboxOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Fechar"
              className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <X className="size-5" />
            </button>

            {images.length > 1 ? (
              <p className="absolute top-4 left-4 text-sm text-white/70">
                {activeIndex + 1} / {images.length}
              </p>
            ) : null}

            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    goToPrevious()
                  }}
                  aria-label="Foto anterior"
                  className="absolute left-2 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-4"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    goToNext()
                  }}
                  aria-label="Próxima foto"
                  className="absolute right-2 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-4"
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            ) : null}

            <div
              className="relative mx-auto aspect-16/9 w-full max-w-5xl px-4"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence initial={false}>
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="absolute inset-x-4 inset-y-0"
                >
                  <Image
                    src={active.url}
                    alt={title}
                    fill
                    className="object-contain"
                    sizes="100vw"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
