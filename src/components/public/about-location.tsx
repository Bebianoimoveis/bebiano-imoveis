import { Clock, MapPin, Phone } from "lucide-react"

import { Reveal } from "@/components/motion/reveal"
import { AccentWord } from "@/components/public/accent-word"
import { getPublicContactInfo } from "@/modules/settings/actions"

// Sem endereço fixo de propósito: o atendimento acontece com hora marcada
// nos estandes dos empreendimentos, não num escritório físico — por isso
// não há mapa/rota aqui, só a área de atuação.
export async function AboutLocation() {
  const { phone, businessHours } = await getPublicContactInfo()

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

      <Reveal className="flex flex-col gap-5">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 size-5 shrink-0 text-gold" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">
            Não temos um ponto fixo — agendamos e atendemos você nos estandes de todos os
            empreendimentos que representamos em toda a região do Alto Tietê.
          </p>
        </div>
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
      </Reveal>
    </section>
  )
}
