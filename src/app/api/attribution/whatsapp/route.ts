import { NextResponse } from "next/server"

import { resolveWhatsappTarget } from "@/modules/attribution/service"

// Rota dedicada (em vez de resolver isso na própria página/layout) pra não
// forçar renderização dinâmica em páginas públicas que hoje são estáticas
// (a home, por exemplo) — `cookies()` dentro de um layout/página opta a
// rota inteira pra dynamic rendering. Os componentes de WhatsApp buscam
// isso no cliente, mantendo as páginas estáticas intactas.
export async function GET() {
  const target = await resolveWhatsappTarget()
  return NextResponse.json(target)
}
