import { NextResponse } from "next/server"

import {
  REFERRAL_COOKIE_MAX_AGE_SECONDS,
  REFERRAL_COOKIE_NAME,
} from "@/modules/attribution/constants"
import { captureReferral } from "@/modules/attribution/service"

// `dest`/`landing` vêm de query string controlada por quem gerou o link
// (potencialmente um atacante) — sem essa checagem, `dest=https://evil.com`
// ou `dest=//evil.com` (URL protocol-relative) faziam este endpoint
// redirecionar pra fora do site (open redirect), útil em phishing porque
// o link inicial é do domínio real. Só aceita caminho relativo começando
// com uma única barra.
function safeRelativePath(value: string | null, fallback: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback
  return value
}

// Único ponto que efetivamente grava uma atribuição — o middleware (Edge
// Runtime, sem acesso a Prisma nesta versão do Next) só detecta que uma
// referência nova precisa ser capturada e redireciona pra cá. Roda em
// runtime Node.js normal (padrão de Route Handler), então pode usar o
// banco diretamente. Só é acionado uma vez por visitante (a primeira vez
// que ele chega com ?ref=/?corretor=//corretor/:slug e ainda não tem
// cookie), nunca em navegação comum.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const dest = safeRelativePath(url.searchParams.get("dest"), "/")
  const source = url.searchParams.get("source")
  const landing = safeRelativePath(url.searchParams.get("landing"), dest)

  const response = NextResponse.redirect(new URL(dest, url))
  if (!code || !source) return response

  const result = await captureReferral({
    code,
    referralSource: source,
    landingUrl: landing,
    utmSource: url.searchParams.get("utm_source"),
    utmMedium: url.searchParams.get("utm_medium"),
    utmCampaign: url.searchParams.get("utm_campaign"),
  })

  // Código não corresponde a nenhum corretor ativo: não cria atribuição
  // nenhuma, só segue pro destino original sem cookie.
  if (result) {
    response.cookies.set(REFERRAL_COOKIE_NAME, result.visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: REFERRAL_COOKIE_MAX_AGE_SECONDS,
      path: "/",
    })
  }

  return response
}
