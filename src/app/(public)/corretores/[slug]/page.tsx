import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Building2, CheckCircle2, User } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/shared/back-button"
import { EmptyState } from "@/components/shared/empty-state"
import { InstagramIcon } from "@/components/shared/instagram-icon"
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon"
import { PropertyCard } from "@/components/public/property-card"
import { Reveal } from "@/components/motion/reveal"
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group"
import { getPublicRealtorBySlug } from "@/modules/realtor/actions"
import { listPublicPropertiesByRealtor } from "@/modules/property/actions"
import { siteConfig } from "@/config/site"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const realtor = await getPublicRealtorBySlug(slug)
  if (!realtor) return {}

  return {
    title: `${realtor.user.name} — ${siteConfig.name}`,
    description: realtor.bio?.slice(0, 160) ?? `Fale com ${realtor.user.name}, corretor(a) da ${siteConfig.name}.`,
  }
}

export default async function RealtorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const realtor = await getPublicRealtorBySlug(slug)
  if (!realtor) notFound()

  const properties = await listPublicPropertiesByRealtor(realtor.id, 12)

  const whatsappHref = `https://wa.me/${realtor.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Olá ${realtor.user.name}! Vim pelo site da Bebiano Imóveis e gostaria de mais informações.`
  )}`

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <BackButton className="mb-6" />

      <Reveal className="flex flex-col items-center gap-6 rounded-3xl bg-card p-6 text-center ring-1 ring-border/60 sm:flex-row sm:items-start sm:p-10 sm:text-left">
        <div className="relative size-28 shrink-0 overflow-hidden rounded-full bg-muted ring-4 ring-gold/20 sm:size-36">
          {realtor.photoUrl ? (
            <Image
              src={realtor.photoUrl}
              alt={realtor.user.name}
              fill
              className="object-cover"
              style={{ objectPosition: `center ${realtor.photoPositionY ?? 0}%` }}
              sizes="144px"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <User className="size-12" strokeWidth={1.25} />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col items-center gap-3 sm:items-start">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              {realtor.user.name}
            </h1>
            {realtor.creci ? (
              <p className="mt-1 text-sm text-muted-foreground">CRECI {realtor.creci}</p>
            ) : null}
          </div>

          {realtor.bio ? (
            <p className="max-w-xl text-sm text-muted-foreground">{realtor.bio}</p>
          ) : null}

          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <Badge variant="outline" className="gap-1.5">
              <Building2 className="size-3.5" />
              {realtor.propertyCount} {realtor.propertyCount === 1 ? "imóvel ativo" : "imóveis ativos"}
            </Badge>
            {realtor.soldOrRentedCount > 0 ? (
              <Badge variant="outline" className="gap-1.5">
                <CheckCircle2 className="size-3.5" />
                {realtor.soldOrRentedCount} negócios concluídos
              </Badge>
            ) : null}
          </div>

          <div className="mt-2 flex items-center gap-3">
            <Button asChild className="gap-2">
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="size-4" />
                Falar no WhatsApp
              </a>
            </Button>
            {siteConfig.instagram ? (
              <a
                href={siteConfig.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram da Bebiano Imóveis"
                className="flex size-10 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                <InstagramIcon className="size-4.5" />
              </a>
            ) : null}
          </div>
        </div>
      </Reveal>

      <section className="mt-12">
        <h2 className="font-heading mb-6 text-xl font-semibold tracking-tight">
          Imóveis com {realtor.user.name.split(" ")[0]}
        </h2>

        {properties.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Nenhum imóvel publicado no momento"
            description="Assim que um novo imóvel for publicado, ele aparece aqui."
          />
        ) : (
          <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <StaggerItem key={property.id}>
                <PropertyCard property={property} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </section>
    </div>
  )
}
