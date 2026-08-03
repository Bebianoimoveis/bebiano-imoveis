import Image from "next/image"
import Link from "next/link"

import { Reveal } from "@/components/motion/reveal"
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group"
import { AccentWord } from "@/components/public/accent-word"
import { resolveSegmentIcon } from "@/lib/segment-icons"
import { listPublicSegments } from "@/modules/segment/actions"
import { cn } from "@/lib/utils"

function buildSegmentHref(segment: Awaited<ReturnType<typeof listPublicSegments>>[number]) {
  const params = new URLSearchParams()
  if (segment.propertyTypeId) params.set("typeId", segment.propertyTypeId)
  if (segment.isLaunch) params.set("isLaunch", "true")
  if (segment.gatedCommunity) params.set("gatedCommunity", "true")
  if (segment.minPrice) params.set("minPrice", segment.minPrice.toString())

  const base = segment.purpose === "RENT" ? "/alugar" : "/comprar"
  const query = params.toString()
  return query ? `${base}?${query}` : base
}

// Categorias 100% administráveis (ver /admin/segmentos) — cada banner é
// um Segment ativo no banco, não mais uma lista fixa no código. Isso
// permite à imobiliária desligar uma categoria (ex: Sítios) ou criar uma
// nova (ex: Locação) sem precisar de deploy.
export async function CategoryBanners() {
  const segments = await listPublicSegments()
  if (segments.length === 0) return null

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <Reveal className="mb-8 sm:mb-10">
        <p className="text-sm font-medium tracking-widest text-gold-dark uppercase">
          Explore por categoria
        </p>
        <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
          O que você <AccentWord>procura</AccentWord>?
        </h2>
      </Reveal>

      <StaggerGroup className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {segments.map((segment, index) => {
          const Icon = resolveSegmentIcon(segment.icon)
          const imageUrl = segment.resolvedImageUrl
          // O primeiro segmento de uma lista com número ímpar ganha
          // destaque (2 colunas) na tela sm+, pra grade nunca fechar
          // "faltando" uma célula.
          const wide = segments.length % 4 === 1 && index === 0

          return (
            <StaggerItem key={segment.id}>
              <Link
                href={buildSegmentHref(segment)}
                className={cn(
                  "group relative flex aspect-4/5 flex-col justify-end overflow-hidden rounded-2xl ring-1 ring-border/60 transition-all duration-500 hover:-translate-y-1 hover:ring-gold/40 sm:rounded-3xl",
                  wide && "sm:col-span-2 sm:aspect-auto"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-card via-secondary to-background">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={segment.name}
                      fill
                      className="object-cover opacity-70 transition-all duration-700 ease-out group-hover:scale-110 group-hover:opacity-85"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <Icon
                      className="absolute top-1/2 left-1/2 size-16 -translate-x-1/2 -translate-y-1/2 text-gold/10 transition-transform duration-700 group-hover:scale-110 sm:size-20"
                      strokeWidth={1}
                    />
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent transition-opacity duration-500 group-hover:from-black/90" />
                <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-shadow duration-500 group-hover:shadow-[0_0_40px_-8px_var(--color-gold)]" />

                <div className="relative z-10 flex flex-col gap-2 p-4 sm:p-5">
                  <Icon
                    className="size-6 text-gold drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)] transition-transform duration-500 ease-out group-hover:-translate-y-0.5 sm:size-7"
                    strokeWidth={1.5}
                  />
                  <p className="font-heading text-sm font-semibold text-white sm:text-base">
                    {segment.name}
                  </p>
                </div>
              </Link>
            </StaggerItem>
          )
        })}
      </StaggerGroup>
    </section>
  )
}
