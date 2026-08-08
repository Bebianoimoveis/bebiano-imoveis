import { listAdminGoals } from "@/modules/goal/actions"
import { listRealtors } from "@/modules/realtor/actions"
import { listCities } from "@/modules/taxonomy/actions"
import { MonthlyGoalCardBody } from "@/components/admin/dashboard/monthly-goal-card-body"

// Some (não renderiza nada) pra quem não tem financial.view — mesma
// permissão que já esconde o módulo Financeiro inteiro do menu.
export async function MonthlyGoalCard() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const goals = await listAdminGoals(year).catch(() => null)
  if (goals === null) return null

  const [realtors, cities] = await Promise.all([listRealtors(), listCities()])

  const goal =
    goals.find((g) => g.scope === "COMPANY" && g.month === month) ??
    goals.find((g) => g.scope === "COMPANY" && g.month === null) ??
    null

  return <MonthlyGoalCardBody goal={goal} year={year} realtors={realtors} cities={cities} />
}
