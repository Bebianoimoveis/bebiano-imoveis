import { CheckCircle2, CircleDollarSign, FileSignature, Hourglass, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { ContractDirectory, ContractNoResults, type ContractRow } from "@/components/admin/contracts/contract-directory"
import { ContractToolbar } from "@/components/admin/contracts/contract-toolbar"
import { ManualContractFormDialog } from "@/components/admin/contracts/manual-contract-form-dialog"
import { FilterNotice } from "@/components/admin/filter-notice"
import { listAdminContracts } from "@/modules/contract/actions"
import { listAdminClients } from "@/modules/client/actions"
import { listRealtors } from "@/modules/realtor/actions"
import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { formatCurrency } from "@/lib/format"
import type { ContractStatus } from "@/generated/prisma/client"

type SearchParams = Record<string, string | string[] | undefined>

const STATUSES: ContractStatus[] = ["DRAFT", "ACTIVE", "COMPLETED", "CANCELED"]

function param(params: SearchParams, key: string) {
  const value = params[key]
  return typeof value === "string" && value ? value : undefined
}

export default async function AdminContractsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const search = param(params, "busca")
  const clientId = param(params, "cliente")
  const realtorId = param(params, "corretor")
  const statusParam = param(params, "status")
  const status = STATUSES.includes(statusParam as ContractStatus) ? (statusParam as ContractStatus) : undefined

  const session = await auth()
  const [allContracts, matching, canManageFinancial, canManageContracts, canViewAll, clients, realtors] =
    await Promise.all([
      listAdminContracts(),
      // Sem o status aqui: os contadores dos botões de status usam esta lista.
      listAdminContracts({ search, clientId, realtorId }),
      can(session?.user, "financial.manage"),
      can(session?.user, "contract.manage"),
      can(session?.user, "contract.view.all"),
      listAdminClients({}),
      listRealtors(),
    ])

  const toRow = (c: (typeof matching)[number]): ContractRow => ({
    id: c.id,
    status: c.status,
    value: Number(c.value),
    createdAt: c.createdAt.toISOString(),
    property: { id: c.property.id, code: c.property.code, title: c.property.title },
    client: { id: c.client.id, name: c.client.name, cpf: c.client.cpf, rg: c.client.rg, phone: c.client.phone },
    realtor: {
      id: c.realtor.id,
      name: c.realtor.user.name,
      photoUrl: c.realtor.photoUrl,
      photoPositionY: c.realtor.photoPositionY,
      creci: c.realtor.creci,
    },
  })

  const statusCounts = Object.fromEntries(STATUSES.map((s) => [s, matching.filter((c) => c.status === s).length]))
  const rows = matching.filter((c) => !status || c.status === status).map(toRow)

  const valid = rows.filter((c) => c.status !== "CANCELED")
  const kpis = [
    {
      label: "Contratos",
      value: String(rows.length),
      hint: rows.length === allContracts.length ? "no total" : `de ${allContracts.length} no total`,
      icon: FileSignature,
      tone: "bg-primary/15 text-primary",
    },
    {
      label: "Valor em contratos",
      value: formatCurrency(valid.reduce((sum, c) => sum + c.value, 0)),
      hint: "sem os cancelados",
      icon: CircleDollarSign,
      tone: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    },
    {
      label: "Em andamento",
      value: String(rows.filter((c) => c.status === "DRAFT" || c.status === "ACTIVE").length),
      hint: "rascunho ou ativo",
      icon: Hourglass,
      tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    },
    {
      label: "Concluídos",
      value: String(rows.filter((c) => c.status === "COMPLETED").length),
      hint: formatCurrency(rows.filter((c) => c.status === "COMPLETED").reduce((sum, c) => sum + c.value, 0)),
      icon: CheckCircle2,
      tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    },
  ]

  const clientName = clientId
    ? (matching[0]?.client.name ?? clients.find((c) => c.id === clientId)?.name ?? "cliente")
    : null
  const clearClient = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && key !== "cliente") clearClient.set(key, value)
  }

  const clientOptions = clients.map((c) => ({ id: c.id, name: c.name, cpf: c.cpf, email: c.email }))
  const realtorOptions = realtors.map((r) => ({ id: r.id, user: { name: r.user.name } }))
  const realtorFilter = canViewAll ? realtors.map((r) => ({ id: r.id, name: r.user.name })) : []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Contratos</h1>
          <p className="text-sm text-muted-foreground">
            Gerados a partir de propostas aceitas, ou cadastrados direto aqui — anexe contratos assinados e
            comprovantes em cada um.
          </p>
        </div>
        {canManageContracts ? (
          <ManualContractFormDialog
            clients={clientOptions}
            realtors={realtorOptions}
            trigger={
              <Button className="gap-1.5">
                <Plus className="size-4" /> Novo contrato
              </Button>
            }
          />
        ) : null}
      </div>

      {allContracts.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title="Nenhum contrato ainda"
          description="Contratos são gerados a partir de propostas aceitas, ou você pode cadastrar um direto em 'Novo contrato'."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="flex items-center gap-3 rounded-[20px] border border-border/60 bg-card p-4 shadow-sm">
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${kpi.tone}`}>
                  <kpi.icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-heading text-lg font-semibold leading-tight sm:text-xl">{kpi.value}</p>
                  <p className="text-xs leading-tight text-muted-foreground">{kpi.label}</p>
                  <p className="truncate text-[11px] text-muted-foreground/80">{kpi.hint}</p>
                </div>
              </div>
            ))}
          </div>

          <ContractToolbar realtors={realtorFilter} statusCounts={statusCounts} />

          {clientName ? (
            <FilterNotice
              message={`Mostrando os contratos de ${clientName}.`}
              clearHref={`/admin/contratos${clearClient.toString() ? `?${clearClient.toString()}` : ""}`}
            />
          ) : null}

          {rows.length === 0 ? (
            <ContractNoResults />
          ) : (
            <ContractDirectory contracts={rows} canManageFinancial={canManageFinancial} />
          )}
        </>
      )}
    </div>
  )
}
