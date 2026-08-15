import Image from "next/image"
import Link from "next/link"
import { User } from "lucide-react"

import { Reveal } from "@/components/motion/reveal"
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group"
import { RealtorWhatsappButton } from "@/components/public/realtor-whatsapp-button"
import { AccentWord } from "@/components/public/accent-word"
import { listPublicRealtors } from "@/modules/realtor/actions"

export async function TeamSection() {
  const realtors = await listPublicRealtors()
  if (realtors.length === 0) return null

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <Reveal className="mb-8 sm:mb-10">
        <p className="text-sm font-medium tracking-widest text-gold-dark uppercase">
          Quem cuida de você
        </p>
        <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
          Nossa <AccentWord>equipe</AccentWord>
        </h2>
      </Reveal>

      <StaggerGroup className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {realtors.map((realtor) => {
          const whatsappHref = `https://wa.me/${realtor.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
            `Olá ${realtor.user.name}! Vim pelo site da Bebiano Imóveis e gostaria de mais informações.`
          )}`

          return (
            <StaggerItem key={realtor.id}>
              {/* Não aninha o botão de WhatsApp dentro do <Link> (HTML
                  inválido — <a> dentro de <a>): o Link cobre o card
                  inteiro via overlay absoluto, e o botão de WhatsApp fica
                  como irmão, por cima, com z-index maior. */}
              <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border/60 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/30 hover:ring-gold/30">
                <Link
                  href={`/corretores/${realtor.slug}`}
                  className="absolute inset-0 z-10"
                  aria-label={`Ver perfil de ${realtor.user.name}`}
                />
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {realtor.photoUrl ? (
                    <Image
                      src={realtor.photoUrl}
                      alt={realtor.user.name}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      style={{ objectPosition: `center ${realtor.photoPositionY ?? 0}%` }}
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <User className="size-10" strokeWidth={1.25} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <RealtorWhatsappButton href={whatsappHref} name={realtor.user.name} />
                </div>
                <div className="flex flex-col gap-0.5 p-4">
                  <p className="truncate font-medium transition-colors group-hover:text-gold-light">
                    {realtor.user.name}
                  </p>
                  {realtor.creci ? (
                    <p className="text-xs text-muted-foreground">CRECI {realtor.creci}</p>
                  ) : null}
                </div>
              </div>
            </StaggerItem>
          )
        })}
      </StaggerGroup>
    </section>
  )
}
