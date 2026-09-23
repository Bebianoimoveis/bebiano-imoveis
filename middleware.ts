import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { authConfig } from "@/lib/auth.config"

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
  // cobre a esmagadora maioria dos requests (navegação comum, sem link
  // de corretor na URL).
  if (!referral) return NextResponse.next()

  // Sempre encaminha pra Route Handler (runtime Node.js, com acesso ao
  // banco) quando há referência na URL, mesmo já existindo cookie — é
  // ela quem decide se mantém a atribuição atual (regra de "primeiro
  // corretor que captou o lead", enquanto esse corretor continuar
  // válido) ou recaptura (corretor do cookie atual foi excluído depois
  // que ele foi gravado). O middleware em si não tem Prisma pra checar
  // isso sozinho.
  const captureUrl = new URL("/api/attribution/capture", req.nextUrl)
  captureUrl.searchParams.set("code", referral.code)
  captureUrl.searchParams.set("source", referral.source)
  captureUrl.searchParams.set(
    "landing",
    req.nextUrl.pathname + req.nextUrl.search
  )

  // O destino final não pode carregar ?ref=/?corretor= — sem isso, a
  // própria página de chegada ainda tem o parâmetro, o middleware
  // detecta de novo e manda pra captura outra vez: loop infinito
  // (ERR_TOO_MANY_REDIRECTS), já que agora sempre encaminha pra
  // captura mesmo com cookie existente.
  const destUrl = new URL(req.nextUrl)
  destUrl.searchParams.delete("ref")
  destUrl.searchParams.delete("corretor")
  const dest = referral.isVanityPath
    ? "/"
    : `${destUrl.pathname}${destUrl.search}`
  captureUrl.searchParams.set("dest", dest)

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
