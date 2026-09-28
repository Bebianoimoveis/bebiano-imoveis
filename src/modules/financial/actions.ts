"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { logActivity } from "@/lib/activity-log"
import { serializeDecimals } from "@/lib/serialize"
import { getGeminiClient, isGeminiConfigured, GEMINI_MODEL, withGeminiRetry } from "@/lib/gemini"
import { getFinancialForecast } from "@/modules/assistant/tools"
import type { Prisma } from "@/generated/prisma/client"
import {
  financialEntryInputSchema,
  financialEntryInteractionSchema,
  financialFiltersSchema,
} from "@/modules/financial/schema"
import * as financialRepository from "@/modules/financial/repository"

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new Error("Não autenticado.")
  return session
}

async function requireFinancialView() {
  const session = await requireSession()
  if (!(await can(session.user, "financial.view"))) {
    throw new Error("Sem permissão para acessar o financeiro.")
  }
  return session
}

async function requireFinancialManage() {
  const session = await requireSession()
  if (!(await can(session.user, "financial.manage"))) {
    throw new Error("Sem permissão para gerenciar o financeiro.")
  }
  return session
}

function buildEntryWhere(filters: ReturnType<typeof financialFiltersSchema.parse>): Prisma.FinancialEntryWhereInput {
  return {
    type: filters.type,
    status: filters.status,
    category: filters.category,
    paymentMethod: filters.paymentMethod,
    realtorId: filters.realtorId,
    property: filters.cityId ? { cityId: filters.cityId } : undefined,
    dueDate:
      filters.from || filters.to
        ? { gte: filters.from, lte: filters.to }
        : undefined,
    OR: filters.search
      ? [
          { category: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
          { client: { name: { contains: filters.search, mode: "insensitive" } } },
          { realtor: { user: { name: { contains: filters.search, mode: "insensitive" } } } },
          { property: { title: { contains: filters.search, mode: "insensitive" } } },
        ]
      : undefined,
  }
}

export async function listAdminFinancialEntries(rawFilters: unknown) {
  await requireFinancialView()
  const filters = financialFiltersSchema.parse(rawFilters ?? {})
  return financialRepository.listEntries(buildEntryWhere(filters))
}

// Widgets "Vencimentos Hoje"/"Alertas" do Dashboard.
export async function getDashboardFinancialAlerts() {
  await requireFinancialView()
  const [dueToday, overdueCount] = await Promise.all([
    financialRepository.listEntriesDueToday(),
    financialRepository.countOverdueEntries(),
  ])
  return { dueToday, overdueCount }
}

export async function getFinancialKpis(rawFilters: unknown = {}) {
  await requireFinancialView()
  const filters = financialFiltersSchema.parse(rawFilters ?? {})
  return financialRepository.getKpiData(buildEntryWhere(filters))
}

export async function getFinancialMonthlySeries(rawFilters: unknown = {}) {
  await requireFinancialView()
  const filters = financialFiltersSchema.parse(rawFilters ?? {})
  return financialRepository.getMonthlySeries(buildEntryWhere(filters))
}

export async function getFinancialExpenseByCategory(rawFilters: unknown = {}) {
  await requireFinancialView()
  const filters = financialFiltersSchema.parse(rawFilters ?? {})
  return financialRepository.getExpenseByCategory(buildEntryWhere(filters))
}

export async function getFinancialIncomeByRealtor(rawFilters: unknown = {}) {
  await requireFinancialView()
  const filters = financialFiltersSchema.parse(rawFilters ?? {})
  return financialRepository.getIncomeByRealtor(buildEntryWhere(filters))
}

export async function getFinancialIncomeByCity(rawFilters: unknown = {}) {
  await requireFinancialView()
  const filters = financialFiltersSchema.parse(rawFilters ?? {})
  return financialRepository.getIncomeByCity(buildEntryWhere(filters))
}

export async function getFinancialTopProperties(rawFilters: unknown = {}) {
  await requireFinancialView()
  const filters = financialFiltersSchema.parse(rawFilters ?? {})
  return financialRepository.getTopProperties(buildEntryWhere(filters))
}

export async function getFinancialCashFlowTimeline(rawFilters: unknown = {}) {
  await requireFinancialView()
  const filters = financialFiltersSchema.parse(rawFilters ?? {})
  return financialRepository.getCashFlowTimeline(buildEntryWhere(filters))
}

export async function getFinancialCommissionsByRealtor() {
  await requireFinancialView()
  return financialRepository.getCommissionsByRealtor()
}

function toCsvValue(value: string | number) {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export async function exportFinancialEntriesCsv(rawFilters: unknown = {}) {
  await requireFinancialView()
  const filters = financialFiltersSchema.parse(rawFilters ?? {})
  const entries = await financialRepository.listEntries(buildEntryWhere(filters))

  const header = [
    "Tipo", "Categoria", "Descrição", "Cliente", "Corretor", "Imóvel",
    "Valor", "Vencimento", "Status", "Forma de pagamento",
  ]
  const rows = entries.map((entry) => [
    entry.type === "INCOME" ? "Receita" : "Despesa",
    entry.category,
    entry.description ?? "",
    entry.client?.name ?? entry.contract?.client?.name ?? "",
    entry.realtor?.user.name ?? "",
    entry.property ? `${entry.property.code} - ${entry.property.title}` : "",
    entry.amount.toString(),
    entry.dueDate.toLocaleDateString("pt-BR"),
    entry.status,
    entry.paymentMethod ?? "",
  ])

  return [header, ...rows].map((row) => row.map(toCsvValue).join(",")).join("\n")
}

// Divide o total em centavos pra nunca perder/sobrar 1 centavo por
// arredondamento (ex: R$100,00 em 3x -> 33,34 + 33,33 + 33,33, não
// 33,33 x3 = 99,99). O resto fica com as primeiras parcelas.
function splitAmountIntoInstallments(total: number, installments: number): number[] {
  const totalCents = Math.round(total * 100)
  const baseCents = Math.floor(totalCents / installments)
  const remainderCents = totalCents - baseCents * installments
  return Array.from(
    { length: installments },
    (_, index) => (baseCents + (index < remainderCents ? 1 : 0)) / 100
  )
}

export async function createFinancialEntry(input: unknown) {
  const session = await requireFinancialManage()
  const data = financialEntryInputSchema.parse(input)

  if (data.installments <= 1) {
    const entry = await financialRepository.createEntry({
      type: data.type,
      category: data.category,
      description: data.description,
      amount: data.amount,
      paidAmount: data.paidAmount,
      status: data.status,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      attachmentUrl: data.attachmentUrl,
      attachmentName: data.attachmentName,
      dueDate: data.dueDate,
      paidAt: data.status === "PAID" ? (data.paidAt ?? new Date()) : undefined,
      contract: data.contractId ? { connect: { id: data.contractId } } : undefined,
      client: data.clientId ? { connect: { id: data.clientId } } : undefined,
      realtor: data.realtorId ? { connect: { id: data.realtorId } } : undefined,
      property: data.propertyId ? { connect: { id: data.propertyId } } : undefined,
    })

    await logActivity({
      userId: session.user.id,
      action: "financial.create",
      entityType: "FinancialEntry",
      entityId: entry.id,
    })

    revalidatePath("/admin/financeiro")
    // amount/paidAmount são Decimal — não devolver o objeto Prisma inteiro ao client.
    return { id: entry.id }
  }

  // Parcelado: cada parcela nasce PENDING, sem valor pago — status/valor
  // pago do formulário descrevem um pagamento único, não fazem sentido
  // aplicados de uma vez em parcelas futuras que ainda vão vencer.
  const amounts = splitAmountIntoInstallments(data.amount, data.installments)
  const entriesData = amounts.map((amount, index) => {
    const dueDate = new Date(data.dueDate)
    dueDate.setMonth(dueDate.getMonth() + index)
    return {
      type: data.type,
      category: data.category,
      description: data.description
        ? `${data.description} (${index + 1}/${data.installments})`
        : `Parcela ${index + 1}/${data.installments}`,
      amount,
      status: "PENDING" as const,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      dueDate,
      contract: data.contractId ? { connect: { id: data.contractId } } : undefined,
      client: data.clientId ? { connect: { id: data.clientId } } : undefined,
      realtor: data.realtorId ? { connect: { id: data.realtorId } } : undefined,
      property: data.propertyId ? { connect: { id: data.propertyId } } : undefined,
    }
  })

  const created = await financialRepository.createEntryInstallments(entriesData)

  await logActivity({
    userId: session.user.id,
    action: "financial.create",
    entityType: "FinancialEntry",
    entityId: created[0].id,
    metadata: { installments: data.installments },
  })

  revalidatePath("/admin/financeiro")
  return { id: created[0].id }
}

export async function updateFinancialEntry(id: string, input: unknown) {
  const session = await requireFinancialManage()
  const data = financialEntryInputSchema.partial().parse(input)

  await financialRepository.updateEntry(id, {
    category: data.category,
    description: data.description,
    amount: data.amount,
    paidAmount: data.paidAmount,
    status: data.status,
    paymentMethod: data.paymentMethod,
    notes: data.notes,
    attachmentUrl: data.attachmentUrl,
    attachmentName: data.attachmentName,
    dueDate: data.dueDate,
    paidAt: data.status === "PAID" ? (data.paidAt ?? new Date()) : data.status ? null : undefined,
    contract: data.contractId ? { connect: { id: data.contractId } } : undefined,
    client: data.clientId ? { connect: { id: data.clientId } } : data.clientId === "" ? { disconnect: true } : undefined,
    realtor: data.realtorId ? { connect: { id: data.realtorId } } : data.realtorId === "" ? { disconnect: true } : undefined,
    property: data.propertyId ? { connect: { id: data.propertyId } } : data.propertyId === "" ? { disconnect: true } : undefined,
  })

  await logActivity({
    userId: session.user.id,
    action: "financial.edit",
    entityType: "FinancialEntry",
    entityId: id,
  })

  revalidatePath("/admin/financeiro")
  return { id }
}

export async function markFinancialEntryStatus(
  id: string,
  status: "PAID" | "CANCELED" | "SCHEDULED" | "PENDING",
  paidAmount?: number
) {
  const session = await requireFinancialManage()
  await financialRepository.markEntryStatus(id, status, paidAmount)

  await logActivity({
    userId: session.user.id,
    action: `financial.status.${status.toLowerCase()}`,
    entityType: "FinancialEntry",
    entityId: id,
  })

  revalidatePath("/admin/financeiro")
}

// Alias mantido pro nome usado no fluxo de criação simples já existente.
export async function markFinancialEntryAsPaid(id: string) {
  return markFinancialEntryStatus(id, "PAID")
}

export async function deleteFinancialEntry(id: string) {
  const session = await requireFinancialManage()
  await financialRepository.deleteEntry(id)

  await logActivity({
    userId: session.user.id,
    action: "financial.delete",
    entityType: "FinancialEntry",
    entityId: id,
  })

  revalidatePath("/admin/financeiro")
}

export async function duplicateFinancialEntry(id: string) {
  const session = await requireFinancialManage()
  const duplicate = await financialRepository.duplicateEntry(id)

  await logActivity({
    userId: session.user.id,
    action: "financial.duplicate",
    entityType: "FinancialEntry",
    entityId: duplicate.id,
    metadata: { sourceId: id },
  })

  revalidatePath("/admin/financeiro")
  return { id: duplicate.id }
}

export async function getAdminFinancialEntry(id: string) {
  await requireFinancialView()
  const entry = await financialRepository.findEntryById(id)
  return entry ? serializeDecimals(entry) : null
}

export async function addFinancialEntryInteraction(entryId: string, input: unknown) {
  const session = await requireFinancialManage()
  const data = financialEntryInteractionSchema.parse(input)

  await financialRepository.createEntryInteraction({
    entryId,
    userId: session.user.id,
    type: data.type,
    description: data.description,
  })

  revalidatePath("/admin/financeiro")
}

// Cache da última análise — mostrado assim que a página abre, sem
// gastar nenhum token. Só quando a pessoa clica em "Gerar análise" é
// que a IA é consultada de verdade (ver generateFinancialInsights).
export async function getFinancialInsight() {
  await requireFinancialView()
  const insight = await financialRepository.getLatestFinancialInsight()
  return insight ? { text: insight.text, generatedAt: insight.generatedAt } : null
}

const FINANCIAL_INSIGHTS_SYSTEM_INSTRUCTION = `Você é uma consultora financeira sênior especializada em imobiliárias, contratada pra fazer a leitura financeira completa da Bebiano Imóveis a partir dos dados reais do sistema, enviados em JSON na mensagem do usuário. Não é um resumo de KPIs — é um parecer de especialista, do tipo que uma gestora financeira experiente entregaria depois de estudar os números com calma.

FORMATO: texto simples, sem markdown nenhum (nada de **negrito**, #títulos, listas com * ou -). Organize a resposta em blocos: um título curto em maiúsculas seguido de dois-pontos (ex: "COMPARATIVO MÊS A MÊS:"), com um ou dois parágrafos de verdade embaixo (não uma frase solta), separados por uma linha em branco entre blocos. Valores em R$ 890.000,00, datas em 09/08/2026, percentuais em 42%.

PROFUNDIDADE: cada bloco precisa ir além de descrever o número — explique o porquê por trás dele quando os dados permitirem (ex: não só "despesa subiu 20%", mas qual categoria puxou essa alta e o que isso sugere), conecte um bloco a outro quando fizer sentido (ex: se a previsão aponta saldo negativo, relacione com qual despesa ou queda de receita está causando isso), e não repita a mesma informação em blocos diferentes. Isso não é opcional — respostas curtas e genéricas não atendem ao que se espera aqui.

REGRAS: use só os números do JSON fornecido — nunca invente ou estime um valor que não esteja lá. O campo "forecast" já vem com a projeção calculada (método de ritmo real do mês comparado à média histórica) — cite o método dele, nunca calcule uma previsão nova por conta própria. Sempre cite o número exato por trás de cada afirmação.

ESTRUTURA esperada:
COMPARATIVO MÊS A MÊS: compare o mês atual (currentMonth) com o anterior (previousMonth) — receita, despesa e saldo, em valor e em variação percentual. Aponte o que mais pesou nessa mudança.
TENDÊNCIA DOS ÚLTIMOS MESES: leitura de verdade da série monthlySeries — não só "subiu/desceu", mas o padrão ao longo do tempo (sazonalidade, meses atípicos, se a curva de receita é consistente ou errática), cruzando com despesas por categoria (expenseByCategory) — quais categorias mais pesam no total e se alguma está crescendo desproporcionalmente.
PREVISÃO E RISCO: o que "forecast" indica pro fechamento do mês atual, deixando explícito que é estimativa. Se o ritmo aponta pra saldo negativo, seja direto sobre isso e sobre o tamanho do risco, comparando com historicalAverageBalanceLast3Months quando disponível.
DESEMPENHO POR CORRETOR: só se "commissions" e/ou "incomeByRealtor" vierem no JSON — compare os corretores pelo nome, não em abstrato: quem vendeu mais (soldValue), quem tem mais comissão pendente de receber, alguma discrepância grande entre quem mais e quem menos rendeu, e o que essa distribuição sugere sobre dependência de um corretor específico.
IMÓVEIS E REGIÕES QUE MAIS RENDEM: só se "topProperties" e/ou "incomeByCity" vierem no JSON — qual imóvel/cidade concentra mais receita e se isso é saudável ou um risco de concentração.
VEREDITO — COMO ESTÁ O NEGÓCIO: julgamento direto e fundamentado — saudável, em atenção ou preocupante — amarrado aos números citados acima, nunca uma impressão genérica solta.
SUGESTÕES DE UMA ESPECIALISTA: de 3 a 5 ações concretas e priorizadas (a mais urgente primeiro), cada uma explicando o raciocínio por trás (por que essa ação, baseada em qual número) e não só o quê fazer — assim como uma consultora explicaria pra dona do negócio, nunca conselho genérico de mercado.`

// Painel "Análise com IA" da Gestão Financeira — gerado sob demanda
// (custa uma chamada real ao Gemini), nunca automático. O resultado é
// salvo em FinancialInsight pra ficar disponível de graça (sem gastar
// token de novo) até a próxima vez que alguém pedir uma atualização.
export async function generateFinancialInsights(): Promise<
  { text: string; generatedAt: Date } | { error: string }
> {
  await requireFinancialView()

  if (!isGeminiConfigured()) {
    return {
      error:
        "A IA ainda não foi configurada neste sistema. Peça para o administrador adicionar a chave GEMINI_API_KEY nas variáveis de ambiente do projeto.",
    }
  }

  const [kpis, monthlySeries, expenseByCategory, commissions, incomeByRealtor, incomeByCity, topProperties, forecast] =
    await Promise.all([
      getFinancialKpis({}),
      getFinancialMonthlySeries({}),
      getFinancialExpenseByCategory({}),
      getFinancialCommissionsByRealtor().catch(() => null),
      getFinancialIncomeByRealtor({}).catch(() => null),
      getFinancialIncomeByCity({}).catch(() => null),
      getFinancialTopProperties({}).catch(() => null),
      getFinancialForecast(),
    ])

  const payload = {
    currentMonth: kpis.currentMonth,
    previousMonth: kpis.previousMonth,
    year: kpis.year,
    pendingIncome: kpis.pendingIncome,
    pendingExpense: kpis.pendingExpense,
    averageTicket: kpis.averageTicket,
    monthlySeries,
    expenseByCategory,
    commissions,
    incomeByRealtor,
    incomeByCity,
    topProperties,
    forecast,
  }

  try {
    const ai = getGeminiClient()
    const chat = ai.chats.create({
      model: GEMINI_MODEL,
      config: { systemInstruction: FINANCIAL_INSIGHTS_SYSTEM_INSTRUCTION },
    })
    const response = await withGeminiRetry(() =>
      chat.sendMessage({ message: JSON.stringify(JSON.parse(JSON.stringify(payload))) })
    )
    const text = response.text || "Não consegui gerar a análise agora. Tente novamente."
    const saved = await financialRepository.saveFinancialInsight(text)
    return { text: saved.text, generatedAt: saved.generatedAt }
  } catch (error) {
    console.error("generateFinancialInsights failed", error)
    return { error: "Ocorreu um erro ao consultar a IA. Tente novamente em instantes." }
  }
}
