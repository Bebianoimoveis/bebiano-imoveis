export function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value))
}

// Server Components renderizam no servidor (Vercel, UTC) — `toLocaleString`
// sem `timeZone` explícito usa o fuso do runtime, não o de Brasília, e
// mostrava hora/data erradas em até 3h (22h virava "01:00", por exemplo).
// Componentes client não precisam disso: já rodam no navegador, em hora
// de Brasília de verdade.
const BRAZIL_TIME_ZONE = "America/Sao_Paulo"

export function formatDateBR(date: Date | string, options?: Intl.DateTimeFormatOptions) {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("pt-BR", { timeZone: BRAZIL_TIME_ZONE, ...options })
}

export function formatTimeBR(date: Date | string, options?: Intl.DateTimeFormatOptions) {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: BRAZIL_TIME_ZONE, ...options })
}

export function formatDateTimeBR(date: Date | string, options?: Intl.DateTimeFormatOptions) {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleString("pt-BR", { timeZone: BRAZIL_TIME_ZONE, ...options })
}

// Usado no Kanban de leads pra "tempo no estágio"/"última interação" —
// por extenso (sem abreviação) porque "1m" era ambíguo entre minuto e
// mês.
export function formatRelativeTime(date: Date | string) {
  const target = typeof date === "string" ? new Date(date) : date
  const diffMs = Date.now() - target.getTime()
  const minutes = Math.floor(diffMs / 60000)

  const unit = (value: number, singular: string, plural: string) =>
    `${value} ${value === 1 ? singular : plural}`

  if (minutes < 1) return "agora"
  if (minutes < 60) return unit(minutes, "minuto", "minutos")
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return unit(hours, "hora", "horas")
  const days = Math.floor(hours / 24)
  if (days < 30) return unit(days, "dia", "dias")
  const months = Math.floor(days / 30)
  return unit(months, "mês", "meses")
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
