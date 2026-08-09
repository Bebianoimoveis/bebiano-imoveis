import { z } from "zod"

export const assistantMessageSchema = z.object({
  role: z.enum(["user", "model"]),
  content: z.string().min(1).max(4000),
})

export const askAssistantSchema = z.object({
  messages: z.array(assistantMessageSchema).min(1).max(40),
})

export type AssistantMessage = z.infer<typeof assistantMessageSchema>
