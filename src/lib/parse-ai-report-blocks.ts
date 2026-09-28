// Cada bloco de um relatório gerado pela IA (Inteligência de Negócios,
// Gestão Financeira) vem separado por linha em branco e começa com
// "TÍTULO:" (instrução de sistema nas actions correspondentes) —
// parseado aqui só pra dar um título em destaque a cada bloco, sem
// exigir nenhum markdown da IA (a interface não interpreta markdown).
export function parseAiReportBlocks(text: string) {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const match = block.match(/^([A-ZÀ-Ú][A-ZÀ-Ú\s]{2,40}):\s*([\s\S]*)$/)
      if (!match) return { title: null, body: block }
      return { title: match[1].trim(), body: match[2].trim() }
    })
}
