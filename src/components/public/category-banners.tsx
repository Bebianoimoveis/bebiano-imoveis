import Image from "next/image"
import Link from "next/link"
import {
  Building,
  Building2,
  Crown,
  Home,
  Sparkles,
  Store,
  Trees,
} from "lucide-react"

import { Reveal } from "@/components/motion/reveal"
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group"
import { listPublicProperties } from "@/modules/property/actions"
import { cn } from "@/lib/utils"

type PropertyType = { id: string; name: string }

type Category = {
  key: string
  label: string
  icon: typeof Home
  href: string
  filters: Record<string, unknown>
}

function buildCategories(propertyTypes: PropertyType[]): Category[] {
  const findType = (needle: string) =>
    propertyTypes.find((type) => type.name.toLowerCase().includes(needle))?.id

  const apartamento = findType("apartamento")
  const casa = findType("casa")
  const terreno = findType("terreno")
  const comercial = findType("comercial") ?? findType("sala") ?? findType("loja")

  return [
    {
      key: "apartamentos",
      label: "Apartamentos",
      icon: Building2,
      href: apartamento ? `/comprar?typeId=${apartamento}` : "/comprar",
      filters: { typeId: apartamento },
    },
    {
      key: "casas",
      label: "Casas",
      icon: Home,
      href: casa ? `/comprar?typeId=${casa}` : "/comprar",
      filters: { typeId: casa },
    },
    {
      key: "condominios",
      label: "Condomínios",
      icon: Building,
      href: "/comprar?gatedCommunity=true",
      filters: { gatedCommunity: true },
    },
    {
      key: "lancamentos",
      label: "Lançamentos",
      icon: Sparkles,
      href: "/comprar?isLaunch=true",
      filters: { isLaunch: true },
    },
    {
      key: "terrenos",
      label: "Terrenos",
      icon: Trees,
      href: terreno ? `/comprar?typeId=${terreno}` : "/comprar",
      filters: { typeId: terreno },
    },
    {
      key: "comerciais",
      label: "Imóveis Comerciais",
      icon: Store,
      href: comercial ? `/comprar?typeId=${comercial}` : "/comprar",
      filters: { typeId: comercial },
    },
    {
      key: "alto-padrao",
      label: "Casas de Alto Padrão",
      icon: Crown,
      href: casa ? `/comprar?typeId=${casa}&minPrice=1200000` : "/comprar?minPrice=1200000",
      filters: { typeId: casa, minPrice: "1200000" },
    },
  ]
}

export async function CategoryBanners({
  propertyTypes,
}: {
  propertyTypes: PropertyType[]
}) {
  const categories = buildCategories(propertyTypes)

  // Sem imagem própria por categoria no banco — usa a capa do imóvel mais
  // recente que casa com cada filtro como fundo do banner, degradando pra
  // um fundo sólido com o ícone quando a categoria ainda não tem nenhum
  // imóvel publicado (ex.: nenhum lançamento cadastrado ainda).
  const previews = await Promise.all(
    categories.map(async (category) => {
      if (!category.filters.typeId && !category.filters.gatedCommunity && !category.filters.isLaunch) {
        return null
      }
      const { items } = await listPublicProperties({ ...category.filters, page: 1 })
      const property = items[0]
      const cover = property?.images.find((image) => image.isCover) ?? property?.images[0]
      return cover?.url ?? null
    })
  )

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <Reveal className="mb-8 sm:mb-10">
        <p className="text-sm font-medium tracking-widest text-gold-dark uppercase">
          Explore por categoria
        </p>
        <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
          O que você procura?
        </h2>
      </Reveal>

      <StaggerGroup className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {categories.map((category, index) => {
          const Icon = category.icon
          const imageUrl = previews[index]
          return (
            <StaggerItem key={category.key}>
              <Link
                href={category.href}
                className={cn(
                  "group relative flex aspect-4/5 flex-col justify-end overflow-hidden rounded-2xl ring-1 ring-border/60 transition-all duration-500 hover:-translate-y-1 hover:ring-gold/40 sm:rounded-3xl",
                  category.key === "lancamentos" && "sm:col-span-2 sm:aspect-auto"
                )}
              >
                <div className="absolute inset-0 bg-secondary">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={category.label}
                      fill
                      className="object-cover opacity-70 transition-all duration-700 ease-out group-hover:scale-110 group-hover:opacity-85"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : null}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent transition-opacity duration-500 group-hover:from-black/90" />
                <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-shadow duration-500 group-hover:shadow-[0_0_40px_-8px_var(--color-gold)]" />

                <div className="relative z-10 flex flex-col gap-2 p-4 sm:p-5">
                  <span className="flex size-9 w-fit items-center justify-center rounded-full bg-gold/15 text-gold ring-1 ring-gold/30 backdrop-blur-sm transition-transform duration-500 group-hover:scale-110">
                    <Icon className="size-4.5" strokeWidth={1.75} />
                  </span>
                  <p className="font-heading text-sm font-semibold text-white sm:text-base">
                    {category.label}
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
