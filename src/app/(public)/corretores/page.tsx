import type { Metadata } from "next"

import { BackButton } from "@/components/shared/back-button"
import { EmptyState } from "@/components/shared/empty-state"
import { Reveal } from "@/components/motion/reveal"
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group"
import { AccentWord } from "@/components/public/accent-word"
import { RealtorCard } from "@/components/public/realtor-card"
import { listPublicRealtors } from "@/modules/realtor/actions"
import { siteConfig } from "@/config/site"
import { Users } from "lucide-react"

export const metadata: Metadata = {
  title: "Nossa equipe",
  description: `Conheça os corretores da ${siteConfig.name}.`,
}

// Equipe inteira — a seção "Nossa equipe" da home/Sobre mostra só os 8
// primeiros e linka pra cá.
export default async function TeamPage() {
  const realtors = await listPublicRealtors()

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <BackButton className="mb-6" />

      <Reveal className="mb-8">
        <p className="text-sm font-medium tracking-widest text-gold-dark uppercase">Quem cuida de você</p>
        <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
          Nossa <AccentWord>equipe</AccentWord>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {realtors.length} {realtors.length === 1 ? "corretor" : "corretores"} prontos pra te ajudar.
        </p>
      </Reveal>

      {realtors.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum corretor por aqui ainda"
          description="Em breve você conhece nossa equipe."
        />
      ) : (
        <StaggerGroup className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {realtors.map((realtor) => (
            <StaggerItem key={realtor.id}>
              <RealtorCard realtor={realtor} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </div>
  )
}
