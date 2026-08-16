// Nomes dos papéis (Role.name) são salvos em inglês no banco (seed) — este
// mapa é só para exibição em pt-BR nas telas de usuários.
export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  REALTOR: "Corretor",
  MANAGER: "Gerente",
  FINANCIAL: "Financeiro",
}

export function roleLabel(roleName: string) {
  return ROLE_LABELS[roleName] ?? roleName
}
