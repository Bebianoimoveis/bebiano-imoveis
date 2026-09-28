import { z } from "zod"

const titleTextItemSchema = z.object({
  title: z.string().min(1, "Preencha o título."),
  text: z.string().min(1, "Preencha o texto."),
})

const statItemSchema = z.object({
  // Number puro (não z.coerce): o input já manda number pronto via
  // `valueAsNumber` do react-hook-form — coerce aqui quebra a inferência
  // de tipo entre zodResolver e useForm (input vs output type de um
  // schema com coerce divergem).
  value: z.number(),
  suffix: z.string(),
  label: z.string().min(1, "Preencha a legenda."),
})

const missionValuesSchema = z.object({
  missao: z.string().min(1),
  visao: z.string().min(1),
  valores: z.string().min(1),
  proposito: z.string().min(1),
})

const foundationsSchema = z.object({
  verseRef: z.string().min(1),
  verseText: z.string().min(1),
  ruleText: z.string().min(1),
  ruleRef: z.string().min(1),
  badgeText: z.string().min(1),
  badgeAuthor: z.string().min(1),
  priorities: z.array(z.string().min(1)).length(3),
  purpose: z.array(titleTextItemSchema).length(3),
})

export const siteSettingsInputSchema = z.object({
  phone: z.string().min(8, "Informe um telefone válido."),
  whatsapp: z.string().min(8, "Informe um WhatsApp válido."),
  email: z.email("Informe um e-mail válido."),
  address: z.string().min(5, "Informe o endereço."),
  aboutText: z.string().max(4000).optional(),
  businessHours: z.string().max(200).optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  rentalEnabled: z.boolean(),
  heroImageUrl: z.string().optional(),
  aboutHeroImageUrl: z.string().optional(),
  aboutStoryImageUrl: z.string().optional(),
  // Conteúdo editável das seções fixas de "/sobre" — ver comentário no
  // schema.prisma (model SiteSettings). Opcionais pra não quebrar caso
  // algum dia o form seja enviado parcialmente; na prática o formulário
  // sempre manda os 7 preenchidos (com o padrão do site quando a pessoa
  // não editou nada ainda).
  aboutStats: z.array(statItemSchema).length(3).optional(),
  aboutMissionValues: missionValuesSchema.optional(),
  aboutFoundations: foundationsSchema.optional(),
  aboutDifferentiators: z.array(titleTextItemSchema).length(4).optional(),
  aboutHowWeWork: z.array(titleTextItemSchema).length(5).optional(),
  aboutValues: z.array(titleTextItemSchema).length(6).optional(),
  aboutWhyChoose: z.array(titleTextItemSchema).length(6).optional(),
})

export type SiteSettingsInput = z.infer<typeof siteSettingsInputSchema>
