import {
  AirVent,
  Archive,
  ArrowUpDown,
  Baby,
  CheckCircle2,
  Dumbbell,
  Flame,
  PartyPopper,
  ShieldCheck,
  Sun,
  Trophy,
  UtensilsCrossed,
  Waves,
  type LucideIcon,
} from "lucide-react"

// PropertyFeature é texto livre (cadastrado em Admin > Taxonomias, sem
// campo de ícone próprio) — mapeamento por nome em vez de mexer no
// schema. Nomes não reconhecidos caem no ícone genérico (CheckCircle2),
// nunca quebram por causa de uma característica nova/digitada diferente.
const FEATURE_ICONS: Record<string, LucideIcon> = {
  "academia": Dumbbell,
  "ar condicionado": AirVent,
  "armários planejados": Archive,
  "churrasqueira": Flame,
  "elevador": ArrowUpDown,
  "piscina": Waves,
  "playground": Baby,
  "portaria 24h": ShieldCheck,
  "quadra poliesportiva": Trophy,
  "salão de festas": PartyPopper,
  "varanda gourmet": UtensilsCrossed,
  "área de lazer": Sun,
}

export function resolvePropertyFeatureIcon(name: string): LucideIcon {
  return FEATURE_ICONS[name.trim().toLowerCase()] ?? CheckCircle2
}
