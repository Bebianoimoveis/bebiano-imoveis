import {
  Building2,
  Fence,
  Gem,
  Home,
  KeyRound,
  LandPlot,
  Sparkles,
  Store,
  TreePalm,
  Warehouse,
} from "lucide-react"

// Lista fechada de ícones permitidos pra um Segment — evita que o admin
// digite um nome de ícone qualquer que não exista (o que quebraria o
// banner no site público). O <Select> do admin usa exatamente esta
// lista; o site público resolve o nome salvo pra um destes componentes.
export const SEGMENT_ICONS = {
  Home,
  Building2,
  Fence,
  LandPlot,
  Sparkles,
  Store,
  Gem,
  Warehouse,
  TreePalm,
  KeyRound,
} as const

export type SegmentIconName = keyof typeof SEGMENT_ICONS

export const SEGMENT_ICON_NAMES = Object.keys(SEGMENT_ICONS) as SegmentIconName[]

export function resolveSegmentIcon(name: string) {
  return SEGMENT_ICONS[name as SegmentIconName] ?? Home
}
