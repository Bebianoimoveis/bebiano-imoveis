import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Building2, ImageOff, MapPin } from "lucide-react"

import { Reveal } from "@/components/motion/reveal"
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group"
import { formatCurrency } from "@/lib/format"
import { listLaunchProperties } from "@/modules/property/actions"

function launchStatusLabel(property: Awaited<ReturnType<typeof listLaunchProperties>>[number]) {
  if (property.launchDeliveryAt) {
    return `Entrega em ${new Date(property.launchDeliveryAt).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    })}`
  }
  if (property.availableUnits) return `${property.availableUnits} unidades disponíveis`
  return "Em breve"
}

export async function LaunchesSection() {
  const launches = await listLaunchProperties(6)
  if (launches.length === 0) return null

  return (
    <section className="border-t border-border/60 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal className="mb-8 flex items-end justify-between sm:mb-10">
          <div>
            <p className="text-sm font-medium tracking-widest text-gold-dark uppercase">
              Novos empreendimentos
            </p>
            <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
              Lançamentos
            </h2>
          </div>
        </Reveal>

        <StaggerGroup className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
          {launches.map((property) => {
            const cover = property.images.find((image) => image.isCover) ?? property.images[0]
            return (
              <StaggerItem key={property.id} className="w-[82vw] shrink-0 snap-start sm:w-auto">
                <Link
                  href={`/imoveis/${property.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border/60 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/30 hover:ring-gold/30"
                >
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {cover ? (
                      <Image
                        src={cover.url}
                        alt={property.title}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        sizes="(max-width: 768px) 82vw, 33vw"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <ImageOff className="size-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                    <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-accent-foreground shadow-sm">
                      <Building2 className="size-3.5" />
                      {launchStatusLabel(property)}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <p className="line-clamp-2 font-medium leading-snug transition-colors group-hover:text-gold-light">
                      {property.title}
                    </p>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0" />
                      {property.city.name}
                    </p>
                    <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
                      <p className="font-heading text-lg font-semibold text-foreground">
                        A partir de {formatCurrency(property.price.toString())}
                      </p>
                      <ArrowRight className="size-4 shrink-0 text-gold opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            )
          })}
        </StaggerGroup>
      </div>
    </section>
  )
}
