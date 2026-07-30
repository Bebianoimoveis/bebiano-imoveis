export function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value))
}

// Usado no Kanban de leads pra "tempo no estágio"/"última interação" —
// texto curto, sem depender de nenhuma lib de datas nova.
export function formatRelativeTime(date: Date | string) {
  const target = typeof date === "string" ? new Date(date) : date
  const diffMs = Date.now() - target.getTime()
  const minutes = Math.floor(diffMs / 60000)

  if (minutes < 1) return "agora"
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  const months = Math.floor(days / 30)
  return `${months}m`
}

// O administrador controla quanto do endereço é exposto publicamente
// (ver Property.addressVisibility) — este helper é o único lugar que
// decide o que mostrar, para não espalhar essa checagem pela UI.
export function getDisplayAddress(property: {
  addressVisibility: "FULL" | "APPROXIMATE" | "NEIGHBORHOOD_ONLY"
  street: string | null
  number: string | null
  neighborhood: { name: string }
  city: { name: string; state: string }
}) {
  const location = `${property.neighborhood.name}, ${property.city.name} - ${property.city.state}`

  if (property.addressVisibility === "FULL" && property.street) {
    const number = property.number ? `, ${property.number}` : ""
    return `${property.street}${number} - ${location}`
  }

  if (property.addressVisibility === "APPROXIMATE" && property.street) {
    return `${property.street} - ${location}`
  }

  return location
}
