import { randomUUID } from "node:crypto"
import { cache } from "react"
import { cookies } from "next/headers"

import { siteConfig } from "@/config/site"
import * as attributionRepository from "@/modules/attribution/repository"
import {
  REFERRAL_COOKIE_MAX_AGE_SECONDS,
  REFERRAL_COOKIE_NAME,
} from "@/modules/attribution/constants"
import type { AttributedRealtor } from "@/modules/attribution/repository"

export type AttributedRealtorView = {
  id: string
  name: string
  phone: string
  creci: string | null
  photoUrl: string | null
  photoPositionY: number | null
  slug: string | null
}

function formatRealtor(realtor: AttributedRealtor): AttributedRealtorView {
  return {
    id: realtor.id,
    name: realtor.user.name,
    phone: realtor.phone,
    creci: realtor.creci,
    photoUrl: realtor.photoUrl,
    photoPositionY: realtor.photoPositionY,
    slug: realtor.slug,
  }
}

// Lê o cookie de atribuição e busca o registro correspondente no banco —
// nunca confia no valor do cookie além de ser um ponteiro pro visitorId;
// se o registro não existir (cookie forjado/expirado no banco), trata
// como "sem atribuição" em vez de confiar cegamente no cookie.
async function getVisitorAttribution() {
  const cookieStore = await cookies()
  const visitorId = cookieStore.get(REFERRAL_COOKIE_NAME)?.value
  if (!visitorId) return null

  const attribution = await attributionRepository.findAttributionByVisitorId(visitorId)
  if (!attribution) return null

  // Melhor esforço, não bloqueia a renderização por causa de uma métrica.
  void attributionRepository.touchLastVisit(visitorId).catch(() => {})

  return attribution
}

// Uso em Server Components que só precisam exibir o corretor responsável
// (botões de WhatsApp, card "consultor responsável" na página do imóvel).
// Não consome a fila de round-robin — isso só acontece quando um Lead é
// de fato criado (resolveRealtorForNewLead), pra não girar a fila à toa
// em cada visita anônima que nunca vira lead.
// `cache()` deduplica dentro de uma mesma requisição: layout, página e
// vários componentes (WhatsApp do header, footer, hero, card do imóvel)
// podem chamar isso no mesmo request sem repetir a leitura do cookie nem
// a consulta ao banco.
export const resolveAttributedRealtor = cache(
  async (): Promise<AttributedRealtorView | null> => {
    const attribution = await getVisitorAttribution()
    if (attribution) return formatRealtor(attribution.realtor)

    const settings = await attributionRepository.findDistributionSettings()
    if (settings?.defaultRealtorId) {
      const realtor = await attributionRepository.findRealtorById(settings.defaultRealtorId)
      if (realtor) return formatRealtor(realtor)
    }

    return null
  }
)

// Conveniência pros botões de WhatsApp: corretor atribuído se houver, ou
// o número institucional genérico como último fallback.
export const resolveWhatsappTarget = cache(async () => {
  const realtor = await resolveAttributedRealtor()
  return {
    phone: realtor?.phone || siteConfig.whatsapp,
    realtorName: realtor?.name ?? null,
  }
})

export type ResolvedRealtorForLead = {
  realtorId: string | null
  attribution: {
    visitorId: string
    referralSource: string
    landingUrl: string
    utmSource: string | null
    utmMedium: string | null
    utmCampaign: string | null
  } | null
}

// Núcleo da regra "primeiro corretor que captou o lead": usado sempre que
// um formulário público (contato, visita) cria um Lead novo. Ordem de
// prioridade: atribuição do visitante → corretor do imóvel → corretor
// padrão/round-robin configurado → corretor ativo mais antigo.
export async function resolveRealtorForNewLead(
  propertyRealtorId?: string | null
): Promise<ResolvedRealtorForLead> {
  const attribution = await getVisitorAttribution()
  if (attribution) {
    return {
      realtorId: attribution.realtorId,
      attribution: {
        visitorId: attribution.visitorId,
        referralSource: attribution.referralSource,
        landingUrl: attribution.landingUrl,
        utmSource: attribution.utmSource,
        utmMedium: attribution.utmMedium,
        utmCampaign: attribution.utmCampaign,
      },
    }
  }

  if (propertyRealtorId) {
    return { realtorId: propertyRealtorId, attribution: null }
  }

  const settings = await attributionRepository.findDistributionSettings()
  if (settings?.leadDistributionMode === "ROUND_ROBIN") {
    const nextRealtorId = await attributionRepository.assignNextRoundRobinRealtor(
      settings.id,
      settings.roundRobinLastRealtorId
    )
    if (nextRealtorId) return { realtorId: nextRealtorId, attribution: null }
  } else if (settings?.defaultRealtorId) {
    return { realtorId: settings.defaultRealtorId, attribution: null }
  }

  const oldest = await attributionRepository.findOldestActiveRealtor()
  return { realtorId: oldest?.id ?? null, attribution: null }
}

export type CaptureReferralInput = {
  code: string
  referralSource: string
  landingUrl: string
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
}

// Chamado pela proxy (não tem acesso à API `cookies()` de next/headers —
// usa NextRequest/NextResponse diretamente), só cuida da parte de banco:
// resolve o código pro corretor e grava a atribuição. Quem lê/escreve o
// cookie de fato é a própria proxy.
export async function captureReferral(
  input: CaptureReferralInput
): Promise<{ visitorId: string; expiresAt: Date } | null> {
  const realtor = await attributionRepository.findRealtorByReferralCode(input.code)
  if (!realtor) return null

  const visitorId = randomUUID()
  const expiresAt = new Date(Date.now() + REFERRAL_COOKIE_MAX_AGE_SECONDS * 1000)

  await attributionRepository.createVisitorAttribution({
    visitorId,
    realtorId: realtor.id,
    referralSource: input.referralSource,
    landingUrl: input.landingUrl,
    utmSource: input.utmSource,
    utmMedium: input.utmMedium,
    utmCampaign: input.utmCampaign,
    expiresAt,
  })

  return { visitorId, expiresAt }
}
