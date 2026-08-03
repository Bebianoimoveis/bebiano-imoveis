import { ClipboardList } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { SubmissionsTable } from "@/components/admin/submissions/submissions-table"
import { listAdminSubmissions } from "@/modules/submission/actions"
import { listAdminProperties } from "@/modules/property/actions"

export default async function AdminCaptacaoPage() {
  const [submissions, propertiesResult] = await Promise.all([
    listAdminSubmissions(),
    listAdminProperties({ pageSize: 50 }),
  ])

  const properties = propertiesResult.items.map((item) => ({
    id: item.id,
    code: item.code,
    title: item.title,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Captação</h1>
        <p className="text-sm text-muted-foreground">
          Imóveis enviados por visitantes através do formulário público &quot;Quero vender meu imóvel&quot;.
        </p>
      </div>

      {submissions.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhuma captação recebida ainda"
          description="Quando um visitante enviar o formulário público de anúncio, ele aparece aqui."
        />
      ) : (
        <SubmissionsTable submissions={submissions} properties={properties} />
      )}
    </div>
  )
}
