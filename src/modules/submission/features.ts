// Características que o dono marca no formulário público "Anunciar meu
// imóvel" (lista passada pela cliente). Fixa no código porque o visitante
// precisa ver sempre as mesmas opções, agrupadas — diferente do catálogo
// de características do admin (PropertyFeature), que muda a qualquer hora.
export const SUBMISSION_FEATURE_GROUPS = [
  {
    title: "Condomínio",
    items: [
      "Academia",
      "Piscina",
      "Churrasqueira / Espaço gourmet",
      "Portaria 24h",
      "Salão de festas",
      "Playground",
      "Aceita pets",
      "Condomínio fechado",
    ],
  },
  {
    title: "Dentro do imóvel",
    items: [
      "Mobiliado",
      "Semimobiliado",
      "Armários embutidos",
      "Varanda gourmet / Sacada",
      "Ar-condicionado",
      "Quintal / Jardim",
    ],
  },
  {
    title: "Negociação",
    items: ["Aceita financiamento", "Aceita FGTS"],
  },
] as const

export const SUBMISSION_FEATURES = SUBMISSION_FEATURE_GROUPS.flatMap((group) => group.items)

export type SubmissionFeature = (typeof SUBMISSION_FEATURES)[number]

// Caracteres sem acento/caixa pra casar "Ar-condicionado" com "Ar
// condicionado" do catálogo do admin.
function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()
}

// Ao converter a captação em anúncio: ids do catálogo de características
// (PropertyFeature) que batem com alguma parte do que o dono marcou —
// "Churrasqueira / Espaço gourmet" casa com "Churrasqueira" ou "Espaço
// gourmet", o que existir no catálogo.
export function matchCatalogFeatureIds(marked: string[], catalog: { id: string; name: string }[]) {
  const wanted = new Set(marked.flatMap((label) => label.split("/").map(normalize)))
  return catalog.filter((feature) => wanted.has(normalize(feature.name))).map((feature) => feature.id)
}
