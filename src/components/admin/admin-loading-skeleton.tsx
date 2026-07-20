import { Skeleton } from "@/components/ui/skeleton"

// Skeleton genérico para o painel admin — cobre todas as páginas do
// dashboard via um único loading.tsx no layout, então precisa funcionar
// razoavelmente bem para telas de tabela, formulário e kanban por igual.
export function AdminLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 w-40 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      <div className="space-y-3 rounded-xl border border-border/60 bg-card p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
