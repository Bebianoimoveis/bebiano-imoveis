import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/motion/reveal"
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group"
import { AccentWord } from "@/components/public/accent-word"
import { RealtorCard } from "@/components/public/realtor-card"
import { listPublicRealtors } from "@/modules/realtor/actions"

// Até 8 corretores aqui (2 linhas no computador) pra seção não crescer
// sem limite conforme a equipe aumenta — o resto fica em /corretores.
const MAX_VISIBLE = 8

export async function TeamSection() {
  const realtors = await listPublicRealtors()
  if (realtors.length === 0) return null

  const visible = realtors.slice(0, MAX_VISIBLE)
  const hasMore = realtors.length > MAX_VISIBLE

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-20">
      <Reveal className="mb-8 sm:mb-6">
        <p className="text-sm font-medium tracking-widest text-gold-dark uppercase">
          Quem cuida de você
        </p>
        <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
          Nossa <AccentWord>equipe</AccentWord>
        </h2>
      </Reveal>

      <StaggerGroup className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((realtor) => (
          <StaggerItem key={realtor.id}>
            <RealtorCard realtor={realtor} />
          </StaggerItem>
        ))}
      </StaggerGroup>

      {hasMore ? (
        <Reveal className="mt-8 flex justify-center">
          <Button asChild variant="outline" className="gap-2 border-gold/40 hover:border-gold">
            <Link href="/corretores">
              Ver toda a equipe ({realtors.length})
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </Reveal>
      ) : null}
    </section>
  )
}
