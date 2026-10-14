// Conteúdo da seção "Quem somos nós? Conheça a nossa história" da "/sobre".
//
// Números entre colchetes duplos no texto (ex: "[[42]]") são anos que
// crescem sozinhos: o número vale no ano `baseYear` (o ano em que o texto
// foi salvo) e soma +1 a cada virada de ano depois disso. Conta pelo ano
// do calendário, não pelo aniversário (não temos a data), então pode
// adiantar até alguns meses. Tirar os colchetes deixa o número fixo.

export type FounderContent = { name: string; paragraphs: string[] }

export type FoundersContent = {
  baseYear: number
  photoUrl?: string
  founders: FounderContent[]
}

export const DEFAULT_FOUNDERS_CONTENT: FoundersContent = {
  baseYear: 2026,
  founders: [
    {
      name: "Bel",
      paragraphs: [
        "Conheci Jesus com 19 anos, hoje tenho [[42]] anos de idade, sou mãe, sou esposa, e comecei a empreender com 27 anos, há [[15]] anos atrás.",
        "Meu 1º emprego foi como caixa de supermercado, após em loja infantil, depois como auxiliar administrativo, onde estudei e me formei em Administração. Fui Diretora de Vendas na Mary Kay do Brasil, e após trabalhei como Representante Comercial, aí sim conheci e me apaixonei pela Corretagem.",
        "Sempre amei SERVIR e, por amar pessoas, sempre tive a oportunidade de liderar. De forma natural as coisas sempre vinham na minha mão, onde entendi que Deus queria me usar ali, ajudando, guiando e liderando pessoas pra glória dEle.",
      ],
    },
    {
      name: "Jairton",
      paragraphs: [
        "Com 6 anos, tive meu primeiro contato com Jesus, minha conversão aconteceu com 29 anos, hoje tenho [[43]] anos de idade, sou pai, sou esposo e trabalho há [[25]] anos na área de indústria.",
        "Comecei a trabalhar com 14 anos, em supermercado, também fui ajudante de obras e após iniciei na indústria. Na De Carlo fiquei 7 anos e atualmente trabalho há [[18]] anos na AGCO. Mas sempre pensei em mudar de área e agora a oportunidade chegou.",
        "Gosto de ouvir as pessoas, sempre tive bom relacionamento pois tenho paciência com o ser humano, e por isso também sempre SERVI as pessoas ao meu redor, seja no trabalho ou na igreja, onde liderava homens e famílias.",
      ],
    },
  ],
}

const TOKEN = /\[\[(\d+)\]\]/g

export function currentYearBR() {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", year: "numeric" }).format(new Date())
  )
}

function yearsPassed(baseYear: number) {
  return Math.max(0, currentYearBR() - baseYear)
}

// Texto pronto pro site: "[[42]]" vira "43" no ano seguinte ao baseYear.
export function renderFounderText(text: string, baseYear: number) {
  const passed = yearsPassed(baseYear)
  return text.replace(TOKEN, (_, n: string) => String(Number(n) + passed))
}

// Versão pro formulário de edição: mantém os colchetes, mas já com o
// número do ano atual — assim quem edita vê (e salva, com baseYear =
// ano atual) os números certos de hoje, não os de quando foi salvo.
export function advanceFounderText(text: string, baseYear: number) {
  const passed = yearsPassed(baseYear)
  return text.replace(TOKEN, (_, n: string) => `[[${Number(n) + passed}]]`)
}

// Valida o JSON vindo do banco (editável, então pode estar fora do
// formato); qualquer coisa estranha cai pro conteúdo padrão.
export function parseFoundersContent(raw: unknown): FoundersContent {
  const value = raw as Partial<FoundersContent> | null
  const valid =
    value &&
    typeof value.baseYear === "number" &&
    Array.isArray(value.founders) &&
    value.founders.length === 2 &&
    value.founders.every(
      (f) =>
        typeof f?.name === "string" &&
        Array.isArray(f.paragraphs) &&
        f.paragraphs.length === 3 &&
        f.paragraphs.every((p) => typeof p === "string")
    )
  return valid ? (value as FoundersContent) : DEFAULT_FOUNDERS_CONTENT
}
