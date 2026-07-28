"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import * as attributionRepository from "@/modules/attribution/repository"
import { ensureRealtorSlug } from "@/modules/realtor/service"

export type RealtorLinkStat = {
  id: string
  name: string
  slug: string
  visits: number
  leads: number
  sales: number
  conversion: number
  lastAccess: Date | null
}

// Painel "Links dos Corretores" — só quem gerencia corretores acessa.
// Gera o slug na hora, na primeira vez que aparece aqui, pra qualquer
// corretor cadastrado sem um (hoje o cadastro é feito via script avulso,
// sem formulário de edição que já cuidasse disso).
export async function listRealtorLinkStats(): Promise<RealtorLinkStat[]> {
  const session = await auth()
  if (!session?.user) throw new Error("Não autenticado.")
  if (!(await can(session.user, "realtor.manage"))) {
    throw new Error("Sem permissão para visualizar os links dos corretores.")
  }

  const realtors = await attributionRepository.listRealtorLinkStats()

  return Promise.all(
    realtors.map(async (realtor) => {
      const slug = realtor.slug ?? (await ensureRealtorSlug(realtor.id, realtor.user.name))
      const visits = realtor._count.visitorAttributions
      const leads = realtor._count.leads

      return {
        id: realtor.id,
        name: realtor.user.name,
        slug,
        visits,
        leads,
        sales: realtor._count.contracts,
        conversion: visits > 0 ? leads / visits : 0,
        lastAccess: realtor.visitorAttributions[0]?.lastVisitAt ?? null,
      }
    })
  )
}
