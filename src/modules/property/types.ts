export type PropertyImageInput = {
  url: string
  publicId: string
}

export const PUBLIC_PROPERTY_STATUSES = ["PUBLISHED"] as const

export const PROPERTY_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Rascunho",
  IN_REVIEW: "Em análise",
  PUBLISHED: "Publicado",
  RESERVED: "Reservado",
  SOLD: "Vendido",
  RENTED: "Alugado",
  UNAVAILABLE: "Indisponível",
  ARCHIVED: "Arquivado",
}
