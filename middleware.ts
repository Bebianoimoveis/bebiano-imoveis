import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { authConfig } from "@/lib/auth.config"
import { REFERRAL_COOKIE_NAME } from "@/modules/attribution/constants"

const { auth } = NextAuth(authConfig)

// Next.js 16 documenta a renomeação de middleware.ts -> proxy.ts com
// runtime Node.js por padrão, mas nesta versão instalada (16.2.10) o
// Turbopack simplesmente não compila proxy.ts (nenhum "Compiling /proxy"
// aparece, o manifest fica vazio) e o middleware.ts legado continua
// rodando em Edge Runtime de verdade (confirmado: importar Prisma aqui
// quebra com "A Node.js module is loaded... not supported in the Edge
// Runtime"). Por isso este arquivo continua Edge-safe — nada de Prisma
// aqui — e a resolução do corretor (que precisa de banco) é feita por
// uma Route Handler à parte (roda em runtime Node.js normal), pra qual
// este middleware só redireciona quando falta capturar uma atribuição
// nova.
//
// A lógica de login do admin precisa ser replicada à mão (em vez de só
// reexportar `auth` como antes): o callback `authorized` de auth.config.ts
// só é aplicado automaticamente quando `auth` é exportado puro; ao
// envolver com uma função própria (necessário pra adicionar a captura de
// referral), o retorno booleano desse callback deixa de bloquear rota
// nenhuma — só um `Response` explícito (redirect) é respeitado. Por isso
// os redirects abaixo são construídos manualmente.
export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth?.user
  const isOnLoginPage = pathname === "/admin/login"
  const isOnAdmin = pathname.startsWith("/admin")

  if (isOnLoginPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/admin", req.nextUrl))
    }
    return NextResponse.next()
  }

  if (isOnAdmin) {
    if (!isLoggedIn) {
      const signInUrl = req.nextUrl.clone()
      signInUrl.pathname = "/admin/login"
      signInUrl.searchParams.set("callbackUrl", req.nextUrl.href)
      return NextResponse.redirect(signInUrl)
    }
    return NextResponse.next()
  }

  return redirectToReferralCaptureIfNeeded(req)
})

// Corretor pode ser referenciado por /corretor/<slug>, ?ref=<slug> ou
// ?corretor=<id> — todas resolvem pro mesmo campo Realtor.slug/id, sem
// precisar manter dois identificadores por corretor.
function extractReferralCode(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl
  const pathMatch = pathname.match(/^\/corretor\/([^/]+)\/?$/)

  if (pathMatch) return { code: pathMatch[1], source: `path:/corretor/${pathMatch[1]}`, isVanityPath: true }

  const ref = searchParams.get("ref")
  if (ref) return { code: ref, source: `ref:${ref}`, isVanityPath: false }

  const corretor = searchParams.get("corretor")
  if (corretor) return { code: corretor, source: `corretor:${corretor}`, isVanityPath: false }

  return null
}

function redirectToReferralCaptureIfNeeded(req: NextRequest) {
  const referral = extractReferralCode(req)

  // Sem nenhuma referência na URL: segue direto sem tocar em nada —
  // cobre a esmagadora maioria dos requests (visitante sem cookie e sem
  // link, ou visitante já com cookie navegando normalmente).
  if (!referral) return NextResponse.next()

  const hasExistingAttribution = req.cookies.has(REFERRAL_COOKIE_NAME)

  // Regra de "primeiro corretor que captou o lead": um segundo link não
  // sobrescreve a atribuição já existente. Só um admin troca isso depois.
  if (hasExistingAttribution) {
    return referral.isVanityPath
      ? NextResponse.redirect(new URL("/", req.nextUrl))
      : NextResponse.next()
  }

  // Primeiro toque: redireciona pra Route Handler (runtime Node.js) que
  // resolve o corretor no banco e grava o cookie — só acontece uma vez
  // por visitante, não em toda navegação.
  const captureUrl = new URL("/api/attribution/capture", req.nextUrl)
  captureUrl.searchParams.set("code", referral.code)
  captureUrl.searchParams.set("source", referral.source)
  captureUrl.searchParams.set(
    "landing",
    req.nextUrl.pathname + req.nextUrl.search
  )
  captureUrl.searchParams.set("dest", referral.isVanityPath ? "/" : req.nextUrl.pathname + req.nextUrl.search)

  for (const utmKey of ["utm_source", "utm_medium", "utm_campaign"]) {
    const value = req.nextUrl.searchParams.get(utmKey)
    if (value) captureUrl.searchParams.set(utmKey, value)
  }

  return NextResponse.redirect(captureUrl)
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
}
