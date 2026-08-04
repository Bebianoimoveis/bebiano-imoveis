import { Clock, MapPin, Navigation, Phone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/motion/reveal"
import { AccentWord } from "@/components/public/accent-word"
import { getPublicContactInfo } from "@/modules/settings/actions"

export async function AboutLocation() {
  const { phone, address, businessHours } = await getPublicContactInfo()

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <Reveal className="mb-10 sm:mb-12">
        <p className="text-sm font-medium tracking-widest text-gold-dark uppercase">
          Venha nos visitar
        </p>
        <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
          <AccentWord>Localização</AccentWord>
        </h2>
      </Reveal>

      <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
        <Reveal className="flex flex-col gap-5 lg:col-span-2">
          {address ? (
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0 text-gold" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">{address}</p>
            </div>
          ) : null}
          {phone ? (
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 size-5 shrink-0 text-gold" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">{phone}</p>
            </div>
          ) : null}
          {businessHours ? (
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 size-5 shrink-0 text-gold" strokeWidth={1.5} />
              <p className="text-sm whitespace-pre-line text-muted-foreground">{businessHours}</p>
            </div>
          ) : null}

          {address ? (
            <Button asChild className="mt-2 w-fit bg-gold text-accent-foreground hover:bg-gold-light">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation className="size-4" />
                Traçar rota
              </a>
            </Button>
          ) : null}
        </Reveal>

        {address ? (
          <Reveal delay={0.1} className="lg:col-span-3">
            <div className="overflow-hidden rounded-[20px] ring-1 ring-border/60 sm:rounded-3xl">
              <iframe
                title="Localização da Bebiano Imóveis"
                src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
                className="h-72 w-full grayscale-[35%] sm:h-96"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Reveal>
        ) : null}
      </div>
    </section>
  )
}
