import type { Metadata } from "next"

import { AboutHero } from "@/components/public/about-hero"
import { AboutStory } from "@/components/public/about-story"
import { AboutStats } from "@/components/public/about-stats"
import { AboutMissionValues } from "@/components/public/about-mission-values"
import { AboutDifferentiators } from "@/components/public/about-differentiators"
import { TeamSection } from "@/components/public/team-section"
import { AboutHowWeWork } from "@/components/public/about-how-we-work"
import { AboutValuesShowcase } from "@/components/public/about-values-showcase"
import { AboutWhyChoose } from "@/components/public/about-why-choose"
import { AboutTestimonials } from "@/components/public/about-testimonials"
import { AboutLocation } from "@/components/public/about-location"
import { AboutFinalCta } from "@/components/public/about-final-cta"
import {
  getPublicAboutText,
  getPublicHeroImage,
  getPublicAboutStoryImage,
} from "@/modules/settings/actions"
import { listPublicRealtors } from "@/modules/realtor/actions"
import { siteConfig } from "@/config/site"

export const metadata: Metadata = {
  title: "Sobre Nós",
  description: `Conheça a ${siteConfig.name}, imobiliária em ${siteConfig.city}, ${siteConfig.state}.`,
}

// Imagem de fallback para "Nossa História" quando nem a imagem editável em
// Configurações nem nenhum corretor com foto existirem ainda — mesmo
// asset paisagem já usado no Hero da home.
const FALLBACK_STORY_IMAGE = "/images/hero-bg.png"

export default async function AboutPage() {
  const [aboutText, realtors, heroImageUrl, aboutStoryImageUrl] = await Promise.all([
    getPublicAboutText(),
    listPublicRealtors(),
    getPublicHeroImage(),
    getPublicAboutStoryImage(),
  ])

  const storyImage =
    aboutStoryImageUrl ??
    realtors.find((realtor) => realtor.photoUrl)?.photoUrl ??
    FALLBACK_STORY_IMAGE

  return (
    <div>
      {/* 1. Hero */}
      <AboutHero heroImageUrl={heroImageUrl} />

      {/* 2. Nossa História */}
      <AboutStory aboutText={aboutText} imageUrl={storyImage} />

      {/* 3. Números */}
      <AboutStats />

      {/* 4. Missão / Visão / Valores */}
      <AboutMissionValues />

      {/* 5. Nosso Diferencial */}
      <AboutDifferentiators />

      {/* 6. Nossa Equipe (componente reutilizado, já lida com estado vazio) */}
      <TeamSection />

      {/* 7. Como Trabalhamos */}
      <AboutHowWeWork />

      {/* 8. Nossos Valores (showcase maior, distinto do bloco 4) */}
      <AboutValuesShowcase />

      {/* 9. Por Que Escolher a Bebiano */}
      <AboutWhyChoose />

      {/* 10. Depoimentos (scroll horizontal) */}
      <AboutTestimonials />

      {/* 11. Localização */}
      <AboutLocation />

      {/* 12. CTA Final */}
      <AboutFinalCta />
    </div>
  )
}
