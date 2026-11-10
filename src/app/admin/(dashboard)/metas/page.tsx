import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { DashboardSection } from "@/components/admin/dashboard/dashboard-section"
import { GoalsBoard } from "@/components/admin/goals/goals-board"
import { listGoalViews } from "@/modules/goal/actions"
import { listCities } from "@/modules/taxonomy/actions"
import { listRealtors } from "@/modules/realtor/actions"
import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"

type SearchParams = Record<string, string | string[] | undefined>

export default async function AdminGoalsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const currentYear = new Date().getFullYear()
  const yearParam = typeof params.ano === "string" ? Number(params.ano) : NaN
  const year = Number.isInteger(yearParam) && yearParam >= 2020 && yearParam <= 2100 ? yearParam : currentYear

  const session = await auth()
  const [canView, canManage] = await Promise.all([
    can(session?.user, "financial.view"),
    can(session?.user, "financial.manage"),
  ])

  if (!canView) {
    return <p className="text-sm text-muted-foreground">Você não tem permissão para ver as metas.</p>
  }

  const [goals, realtors, cities] = await Promise.all([listGoalViews(year), listRealtors(), listCities()])
  const realtorOptions = realtors
    .filter((realtor) => realtor.active)
    .map((realtor) => ({ id: realtor.id, user: { name: realtor.user.name } }))
  const cityOptions = cities.map((city) => ({ id: city.id, name: city.name, state: city.state }))

  return (
    <div className="space-y-6">
      <DashboardSection index={0} className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/admin" className="hover:text-foreground">
              Visão Geral
            </Link>
            <ChevronRight className="size-3" />
            <span>Metas</span>
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Metas</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe se as metas da empresa e de cada corretor estão sendo batidas.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-card p-1">
          <Link
            href={`/admin/metas?ano=${year - 1}`}
            aria-label="Ano anterior"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <span className="min-w-14 text-center text-sm font-semibold">{year}</span>
          <Link
            href={`/admin/metas?ano=${year + 1}`}
            aria-label="Próximo ano"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </DashboardSection>

      <GoalsBoard
        goals={goals}
        year={year}
        realtors={realtorOptions}
        cities={cityOptions}
        canManage={canManage}
      />
    </div>
  )
}
