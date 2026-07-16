import slugify from "slugify"

const purposeLabel: Record<"SALE" | "RENT", string> = {
  SALE: "a-venda",
  RENT: "para-alugar",
}

function toSlug(value: string) {
  return slugify(value, { lower: true, strict: true, locale: "pt" })
}

// Gera o slug definitivo de um imóvel no formato:
// {tipo}-{finalidade}-no-{bairro}-{cidade}-{codigo}
// O slug é fixado na criação do imóvel e nunca deve ser regenerado após
// publicado — alterar o slug quebraria links compartilhados e SEO.
export function buildPropertySlug(input: {
  typeName: string
  purpose: "SALE" | "RENT"
  neighborhoodName: string
  cityName: string
  code: string
}) {
  const codeNumber = input.code.replace(/\D/g, "")
  const base = toSlug(
    `${input.typeName} ${purposeLabel[input.purpose]} no ${input.neighborhoodName} ${input.cityName}`
  )
  return `${base}-${codeNumber}`
}
