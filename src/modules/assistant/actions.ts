"use server"

import type { Content } from "@google/genai"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { getGeminiClient, isGeminiConfigured, GEMINI_MODEL } from "@/lib/gemini"
import { ASSISTANT_TOOL_DECLARATIONS, executeAssistantTool } from "@/modules/assistant/tools"
import { askAssistantSchema } from "@/modules/assistant/schema"

const SYSTEM_INSTRUCTION = `Você é o assistente de IA do painel administrativo da Bebiano Imóveis, uma imobiliária. Responda em português, de forma direta e objetiva.

Responda sempre em texto simples, sem formatação markdown (nada de **negrito**, ###títulos, listas com * ou -, links em colchetes). A interface do chat só exibe texto puro, então use frases curtas e quebras de linha quando precisar organizar a resposta, sem símbolos.

Você tem ferramentas pra consultar os dados reais do sistema (leads, clientes, imóveis, propostas, financeiro, agenda). SEMPRE chame a ferramenta relevante antes de responder perguntas sobre números — nunca invente ou estime um número sem antes consultar uma ferramenta.

Algumas ferramentas podem devolver um erro (por exemplo, se quem perguntou não tiver permissão pra ver dados financeiros) — nesse caso, explique isso educadamente em vez de inventar um valor.

Se for pedida uma previsão ou projeção, baseie-se nos dados históricos reais devolvidos pelas ferramentas (ex.: vendas dos últimos meses) e deixe claro que é uma estimativa, não um número garantido.

Se a pergunta não tiver relação com o sistema (imóveis, leads, clientes, financeiro, agenda, propostas), explique que você é o assistente do painel e não pode ajudar com isso.`

const MAX_TOOL_ITERATIONS = 5

async function requireAssistantAccess() {
  const session = await auth()
  if (!session?.user) throw new Error("Não autenticado.")
  if (!(await can(session.user, "assistant.use"))) {
    throw new Error("Sem permissão para usar o assistente.")
  }
  return session
}

export async function askAssistant(input: unknown): Promise<{ role: "model"; content: string }> {
  await requireAssistantAccess()

  if (!isGeminiConfigured()) {
    return {
      role: "model",
      content:
        "A IA ainda não foi configurada neste sistema. Peça para o administrador adicionar a chave GEMINI_API_KEY nas variáveis de ambiente do projeto.",
    }
  }

  const { messages } = askAssistantSchema.parse(input)
  const lastMessage = messages[messages.length - 1]
  const history: Content[] = messages.slice(0, -1).map((message) => ({
    role: message.role,
    parts: [{ text: message.content }],
  }))

  try {
    const ai = getGeminiClient()
    const chat = ai.chats.create({
      model: GEMINI_MODEL,
      history,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: ASSISTANT_TOOL_DECLARATIONS }],
      },
    })

    let response = await chat.sendMessage({ message: lastMessage.content })
    let iterations = 0

    while (response.functionCalls && response.functionCalls.length > 0 && iterations < MAX_TOOL_ITERATIONS) {
      const responseParts = await Promise.all(
        response.functionCalls.map(async (call) => {
          const result = await executeAssistantTool(call.name ?? "", (call.args ?? {}) as { periodDays?: number })
          return {
            functionResponse: {
              name: call.name,
              // Round-trip por JSON garante que Decimal/Date (vindos das
              // actions do Prisma) virem string simples antes de ir pro
              // Gemini, em vez de depender do JSON.stringify interno do SDK.
              response: { output: JSON.parse(JSON.stringify(result)) },
            },
          }
        })
      )
      response = await chat.sendMessage({ message: responseParts })
      iterations++
    }

    return {
      role: "model",
      content: response.text || "Não consegui gerar uma resposta. Tente reformular a pergunta.",
    }
  } catch (error) {
    console.error("askAssistant failed", error)
    return {
      role: "model",
      content: "Ocorreu um erro ao consultar a IA. Tente novamente em instantes.",
    }
  }
}
