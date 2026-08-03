import type { Metadata } from "next"

import { Reveal } from "@/components/motion/reveal"
import { AccentWord } from "@/components/public/accent-word"
import { PropertySubmissionForm } from "@/components/public/property-submission-form"
import { listCities, listPublicPropertyTypes } from "@/modules/taxonomy/actions"

export const metadata: Metadata = {
  title: "Anuncie seu imóvel",
  description: "Anuncie seu imóvel gratuitamente com a Bebiano Imóveis — sem compromisso.",
}

export default async function AnunciarPage() {
  const [cities, propertyTypes] = await Promise.all([listCities(), listPublicPropertyTypes()])

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <Reveal className="mb-8 text-center sm:mb-10">
        <p className="text-sm font-medium tracking-widest text-gold-dark uppercase">Quero vender meu imóvel</p>
        <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Anuncie com a <AccentWord>Bebiano</AccentWord>, gratuitamente
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          Conte sobre o seu imóvel e envie algumas fotos. Nossa equipe entra em contato para conversar sobre a
          divulgação — sem custo e sem compromisso.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <PropertySubmissionForm cities={cities} propertyTypes={propertyTypes} />
      </Reveal>
    </div>
  )
}
