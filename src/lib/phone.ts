// Só dígitos, sem o 55 do Brasil: "(11) 99999-0000", "5511999990000" e
// "11999990000" viram o mesmo número.
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  return /^55\d{10,11}$/.test(digits) ? digits.slice(2) : digits
}

// Número no formato do wa.me. Cadastro costuma vir sem o 55, e sem ele o
// link abre em outro país ou não abre.
export function whatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  return /^\d{10,11}$/.test(digits) ? `55${digits}` : digits
}
