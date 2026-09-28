import type { Metadata } from "next"

import { AboutHero } from "@/components/public/about-hero"
import { AboutStory } from "@/components/public/about-story"
import { AboutStats } from "@/components/public/about-stats"
import { AboutMissionValues } from "@/components/public/about-mission-values"
import { AboutFoundations } from "@/components/public/about-foundations"
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
  getPublicAboutHeroImage,
  getPublicAboutStoryImage,
  getPublicAboutSections,
} from "@/modules/settings/actions"
import type { AboutStat } from "@/components/public/about-stats"
import type { AboutMissionValuesContent } from "@/components/public/about-mission-values"
import type { AboutFoundationsContent } from "@/components/public/about-foundations"
import type { AboutDifferentiatorItem } from "@/components/public/about-differentiators"
import type { AboutHowWeWorkStep } from "@/components/public/about-how-we-work"
import type { AboutValueItem } from "@/components/public/about-values-showcase"
import type { AboutWhyChooseReason } from "@/components/public/about-why-choose"
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
  const [aboutText, realtors, aboutHeroImageUrl, aboutStoryImageUrl, sections] = await Promise.all([
    getPublicAboutText(),
    listPublicRealtors(),
    getPublicAboutHeroImage(),
    getPublicAboutStoryImage(),
    getPublicAboutSections(),
  ])

  const storyImage =
    aboutStoryImageUrl ??
    realtors.find((realtor) => realtor.photoUrl)?.photoUrl ??
    FALLBACK_STORY_IMAGE

  return (
    <div>
      {/* 1. Hero */}
      <AboutHero heroImageUrl={aboutHeroImageUrl} />

      {/* 2. Nossa História */}
      <AboutStory aboutText={aboutText} imageUrl={storyImage} />

      {/* 3. Números */}
      <AboutStats stats={(sections.stats as AboutStat[] | null) ?? undefined} />

      {/* 4. Missão / Visão / Propósito */}
      <AboutMissionValues content={(sections.missionValues as AboutMissionValuesContent | null) ?? undefined} />

      {/* 4b. Guiados por uma palavra — versículo-base, regra de vida,
          placa invisível, prioridades e propósito detalhado */}
      <AboutFoundations content={(sections.foundations as AboutFoundationsContent | null) ?? undefined} />

      {/* 5. Nosso Diferencial */}
      <AboutDifferentiators items={(sections.differentiators as AboutDifferentiatorItem[] | null) ?? undefined} />

      {/* 6. Nossa Equipe (componente reutilizado, já lida com estado vazio) */}
      <TeamSection />

      {/* 7. Como Trabalhamos */}
      <AboutHowWeWork steps={(sections.howWeWork as AboutHowWeWorkStep[] | null) ?? undefined} />

      {/* 8. Nossos Valores (showcase maior, distinto do bloco 4) */}
      <AboutValuesShowcase values={(sections.values as AboutValueItem[] | null) ?? undefined} />

      {/* 9. Por Que Escolher a Bebiano */}
      <AboutWhyChoose reasons={(sections.whyChoose as AboutWhyChooseReason[] | null) ?? undefined} />

      {/* 10. Depoimentos (scroll horizontal) */}
      <AboutTestimonials />

      {/* 11. Localização */}
      <AboutLocation />

      {/* 12. CTA Final */}
      <AboutFinalCta />
    </div>
  )
}
