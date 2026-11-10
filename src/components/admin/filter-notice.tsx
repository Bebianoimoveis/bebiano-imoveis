import Link from "next/link"
import { Filter, X } from "lucide-react"

// Faixa "Mostrando só X — Limpar" que aparece quando a pessoa chega numa
// lista vinda de um aviso (ex: "1 lançamento em atraso"), pra ficar claro
// por que a lista está filtrada e dar um jeito de voltar ao normal.
export function FilterNotice({ message, clearHref }: { message: string; clearHref: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm">
      <span className="flex items-center gap-2 font-medium text-foreground">
        <Filter className="size-4 shrink-0 text-amber-400 admin-light:text-amber-600" />
        {message}
      </span>
      <Link href={clearHref} className="flex shrink-0 items-center gap-1 text-xs font-medium text-foreground underline-offset-2 hover:underline">
        <X className="size-3.5" /> Limpar filtro
      </Link>
    </div>
  )
}
