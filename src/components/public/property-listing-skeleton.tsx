import { Skeleton } from "@/components/ui/skeleton"

// Next.js mostra isso instantaneamente via loading.tsx enquanto a busca no
// banco roda no servidor — sem isso, o clique em "Buscar imóveis" fica sem
// nenhum retorno visual até a página inteira (com dados) estar pronta,
// o que em conexões frias com o Neon pode levar alguns segundos e parecer
// que o site travou.
export function PropertyListingSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Skeleton className="mb-8 h-8 w-56" />

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <div className="hidden space-y-6 lg:block">
          <div className="space-y-3 rounded-2xl border border-border/60 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Skeleton className="h-4 w-40" />
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-4/3 w-full rounded-2xl" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3.5 w-2/5" />
                <Skeleton className="h-5 w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
