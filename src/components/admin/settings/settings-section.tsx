import { ChevronDown } from "lucide-react"

// <details>/<summary> nativos em vez de um Accordion novo — a página de
// Configurações ficou grande demais (7 seções da Sobre) pra mostrar tudo
// aberto de uma vez, e isso resolve sem precisar de mais uma dependência
// de UI. `open` no primeiro item ajuda a pessoa a entender o padrão.
export function SettingsSection({
  title,
  description,
  defaultOpen = false,
  children,
}: {
  title: string
  description: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-xl border border-border/60 [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-3 border-t border-border/60 p-4">{children}</div>
    </details>
  )
}
