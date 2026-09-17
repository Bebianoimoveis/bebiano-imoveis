import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Reveal } from "@/components/motion/reveal"
import { AccentWord } from "@/components/public/accent-word"
import { TestimonialReviewForm } from "@/components/public/testimonial-review-form"
import { getRealtorForReview } from "@/modules/testimonial/actions"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const realtor = await getRealtorForReview(slug)
  if (!realtor) return {}

  return {
    title: `Avalie seu atendimento — ${realtor.name}`,
    description: "Conte como foi sua experiência com a Bebiano Imóveis.",
  }
}

export default async function AvaliarPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const realtor = await getRealtorForReview(slug)
  if (!realtor) notFound()

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20">
      <Reveal className="mb-8 text-center sm:mb-10">
        <p className="text-sm font-medium tracking-widest text-gold-dark uppercase">Sua opinião importa</p>
        <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Avalie sua experiência com a <AccentWord>Bebiano</AccentWord>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          Sua avaliação nos ajuda a melhorar cada vez mais e a reconhecer o trabalho de {realtor.name}. Leva só um
          minuto.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <TestimonialReviewForm realtorSlug={slug} realtorName={realtor.name} />
      </Reveal>
    </div>
  )
}
