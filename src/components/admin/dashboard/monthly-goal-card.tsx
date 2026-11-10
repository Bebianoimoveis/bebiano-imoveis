import { getDashboardGoal } from "@/modules/goal/actions"
import { listRealtors } from "@/modules/realtor/actions"
import { listCities } from "@/modules/taxonomy/actions"
import { MonthlyGoalCardBody } from "@/components/admin/dashboard/monthly-goal-card-body"

// Gestão (financial.view) vê a meta da empresa; corretor vê a dele.
// Quem não é nenhum dos dois não vê o card.
export async function MonthlyGoalCard() {
  const summary = await getDashboardGoal().catch(() => null)
  if (summary === null) return null

  const [realtors, cities] = summary.canManage
    ? await Promise.all([listRealtors(), listCities()])
    : [[], []]

  return (
    <MonthlyGoalCardBody
      goal={summary.goal}
      activeCount={summary.activeCount}
      onTrackCount={summary.onTrackCount}
      personal={summary.personal}
      canManage={summary.canManage}
      realtors={realtors.map((realtor) => ({ id: realtor.id, user: { name: realtor.user.name } }))}
      cities={cities.map((city) => ({ id: city.id, name: city.name, state: city.state }))}
    />
  )
}
