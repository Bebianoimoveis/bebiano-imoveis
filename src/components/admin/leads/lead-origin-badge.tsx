import { Globe, MessageCircle, Search, Share2, Users, type LucideIcon } from "lucide-react"

import { InstagramIcon } from "@/components/shared/instagram-icon"

// O campo `origin` é texto livre no banco — hoje só "site" é gravado de
// verdade por qualquer fluxo automático (ver módulo de atribuição), mas o
// formulário de "Novo Lead" já deixa escolher qualquer um destes canais,
// então o badge cobre todos desde já em vez de só o que existe hoje.
const ORIGIN_META: Record<string, { label: string; icon: LucideIcon | typeof InstagramIcon; className: string }> = {
  site: { label: "Site", icon: Globe, className: "bg-primary/10 text-primary" },
  whatsapp: { label: "WhatsApp", icon: MessageCircle, className: "bg-emerald-500/10 text-emerald-500" },
  instagram: { label: "Instagram", icon: InstagramIcon, className: "bg-pink-500/10 text-pink-500" },
  facebook: { label: "Facebook", icon: Share2, className: "bg-blue-500/10 text-blue-500" },
  google: { label: "Google", icon: Search, className: "bg-amber-500/10 text-amber-500" },
  indicacao: { label: "Indicação", icon: Users, className: "bg-violet-500/10 text-violet-500" },
}

export function LeadOriginBadge({ origin }: { origin: string }) {
  const meta = ORIGIN_META[origin.toLowerCase()] ?? {
    label: origin,
    icon: Globe,
    className: "bg-secondary text-muted-foreground",
  }
  const Icon = meta.icon

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.className}`}
    >
      <Icon className="size-3" />
      {meta.label}
    </span>
  )
}

export const LEAD_ORIGIN_OPTIONS = Object.entries(ORIGIN_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}))
