import { getDashboardGoal } from "@/modules/goal/actions"
import { listRealtors } from "@/modules/realtor/actions"
import { listCities } from "@/modules/taxonomy/actions"
import { MonthlyGoalCardBody } from "@/components/admin/dashboard/monthly-goal-card-body"

// Some (não renderiza nada) pra quem não tem financial.view — mesma
// permissão que já esconde o módulo Financeiro inteiro do menu.
export async function MonthlyGoalCard() {
  const summary = await getDashboardGoal().catch(() => null)
  if (summary === null) return null

  const [realtors, cities] = await Promise.all([listRealtors(), listCities()])

  return (
    <MonthlyGoalCardBody
      goal={summary.goal}
      activeCount={summary.activeCount}
      onTrackCount={summary.onTrackCount}
      realtors={realtors.map((realtor) => ({ id: realtor.id, user: { name: realtor.user.name } }))}
      cities={cities.map((city) => ({ id: city.id, name: city.name, state: city.state }))}
    />
  )
}
