// Célula de CSV. Além de escapar aspas/vírgula/quebra, neutraliza texto que
// a planilha interpretaria como fórmula (=, +, -, @): os campos vêm de
// formulários públicos, e "=HYPERLINK(...)" num nome viraria link ativo.
export function toCsvValue(value: string | number): string {
  if (typeof value === "number") return String(value)
  const isPlainNumber = /^-?\d+([.,]\d+)?$/.test(value)
  const text = /^[=+\-@\t\r]/.test(value) && !isPlainNumber ? `'${value}` : value
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}
