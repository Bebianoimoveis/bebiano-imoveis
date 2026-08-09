import { Building2, Crown, Home, Key, TrendingUp, UserCheck, UserPlus, Users } from "lucide-react"

import { StatCard } from "@/components/admin/dashboard/stat-card"

type Stats = {
  total: number
  active: number
  newInPeriod: number
  buyers: number
  sellers: number
  tenants: number
  investors: number
  vip: number
}

export function ClientKpis({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4 xl:grid-cols-4">
      <StatCard
        icon={<Users className="size-5" />}
        label="Total de clientes"
        value={String(stats.total)}
        description="Cadastrados no CRM"
      />
      <StatCard
        icon={<UserCheck className="size-5" />}
        label="Clientes ativos"
        value={String(stats.active)}
        description="Status ativo"
      />
      <StatCard
        icon={<UserPlus className="size-5" />}
        label="Novos clientes"
        value={String(stats.newInPeriod)}
        description="Últimos 30 dias"
      />
      <StatCard
        icon={<Crown className="size-5" />}
        label="Clientes VIP"
        value={String(stats.vip)}
        description="Marcados como VIP"
      />
      <StatCard
        icon={<Home className="size-5" />}
        label="Compradores"
        value={String(stats.buyers)}
        description="Tipo: comprador"
      />
      <StatCard
        icon={<TrendingUp className="size-5" />}
        label="Vendedores"
        value={String(stats.sellers)}
        description="Tipo: vendedor"
      />
      <StatCard
        icon={<Key className="size-5" />}
        label="Locatários"
        value={String(stats.tenants)}
        description="Tipo: locatário"
      />
      <StatCard
        icon={<Building2 className="size-5" />}
        label="Investidores"
        value={String(stats.investors)}
        description="Tipo: investidor"
      />
    </div>
  )
}
