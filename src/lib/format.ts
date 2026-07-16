export function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value))
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
