import Image from "next/image"

import { Reveal } from "@/components/motion/reveal"
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group"
import { AccentWord } from "@/components/public/accent-word"
import { listPublicProperties } from "@/modules/property/actions"
import { listPublicRealtors } from "@/modules/realtor/actions"
import { cn } from "@/lib/utils"

// Grade assimétrica com padrão de tamanhos que se repete a cada 6 itens —
// dá o efeito "mosaico" pedido sem precisar de uma lib de masonry.
const SPAN_PATTERN = [
  "col-span-2 row-span-2",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-1 row-span-2",
  "col-span-2 row-span-1",
  "col-span-1 row-span-1",
]

// Galeria com fotos 100% reais já existentes no sistema — capas de imóveis
// publicados e fotos da equipe. Sem categorias fabricadas (escritório,
// eventos etc.) que não existem no banco.
export async function AboutGallery() {
  const [{ items: properties }, realtors] = await Promise.all([
    listPublicProperties({ pageSize: 8, page: 1 }),
    listPublicRealtors(),
  ])

  const propertyPhotos = properties
    .map((property) => {
      const cover = property.images.find((image) => image.isCover) ?? property.images[0]
      return cover ? { url: cover.url, alt: property.title } : null
    })
    .filter((photo): photo is { url: string; alt: string } => photo !== null)

  const realtorPhotos = realtors
    .filter((realtor) => realtor.photoUrl)
    .map((realtor) => ({ url: realtor.photoUrl as string, alt: realtor.user.name }))

  // Intercala imóveis e equipe para não agrupar todas as fotos do mesmo
  // tipo num canto só da grade.
  const photos: { url: string; alt: string }[] = []
  const maxLen = Math.max(propertyPhotos.length, realtorPhotos.length)
  for (let i = 0; i < maxLen; i++) {
    if (propertyPhotos[i]) photos.push(propertyPhotos[i])
    if (realtorPhotos[i]) photos.push(realtorPhotos[i])
  }

  if (photos.length === 0) return null

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <Reveal className="mb-10 sm:mb-12">
        <p className="text-sm font-medium tracking-widest text-gold-dark uppercase">
          Um retrato do nosso trabalho
        </p>
        <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
          <AccentWord>Galeria</AccentWord>
        </h2>
      </Reveal>

      <StaggerGroup className="grid auto-rows-[130px] grid-cols-2 gap-3 sm:auto-rows-[160px] sm:grid-cols-4 sm:gap-4">
        {photos.slice(0, 12).map((photo, index) => (
          <StaggerItem
            key={`${photo.url}-${index}`}
            className={cn(
              "group relative overflow-hidden rounded-2xl ring-1 ring-border/60",
              SPAN_PATTERN[index % SPAN_PATTERN.length]
            )}
          >
            <Image
              src={photo.url}
              alt={photo.alt}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  )
}
