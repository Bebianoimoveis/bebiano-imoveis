import { prisma } from "@/lib/prisma"
import type { Prisma, LeadStage } from "@/generated/prisma/client"

const leadListInclude = {
  property: { select: { id: true, title: true, code: true, slug: true } },
  realtor: { include: { user: true } },
  client: true,
} satisfies Prisma.LeadInclude

const leadDetailInclude = {
  ...leadListInclude,
  interactions: {
    orderBy: { createdAt: "desc" as const },
    include: { user: true },
  },
} satisfies Prisma.LeadInclude

export type LeadListItem = Prisma.LeadGetPayload<{ include: typeof leadListInclude }>
export type LeadDetail = Prisma.LeadGetPayload<{ include: typeof leadDetailInclude }>

type CreateContactRequestInput = {
  name: string
  phone: string
  email?: string
  message?: string
  propertyId?: string
  source: string
  ipAddress?: string
}

// Cria o registro bruto do formulário (auditoria/anti-spam) e o Lead
// correspondente no CRM em uma única transação — o núcleo do fluxo
// "visitante manda mensagem → vira lead automaticamente".
export async function createContactRequestWithLead(
  input: CreateContactRequestInput
) {
  return prisma.$transaction(async (tx) => {
    const contactRequest = await tx.contactRequest.create({
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        message: input.message || null,
        propertyId: input.propertyId,
        source: input.source,
        ipAddress: input.ipAddress,
      },
    })

    const property = input.propertyId
      ? await tx.property.findUnique({
          where: { id: input.propertyId },
          select: { realtorId: true },
        })
      : null

    const lead = await tx.lead.create({
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        origin: "site",
        stage: "NEW",
        notes: input.message || null,
        propertyId: input.propertyId,
        realtorId: property?.realtorId ?? null,
      },
    })

    return { contactRequest, lead }
  })
}

export async function listLeads(
  where: Prisma.LeadWhereInput
): Promise<LeadListItem[]> {
  return prisma.lead.findMany({
    where: { ...where, deletedAt: null },
    include: leadListInclude,
    orderBy: { createdAt: "desc" },
  })
}

export async function findLeadById(id: string): Promise<LeadDetail | null> {
  return prisma.lead.findFirst({
    where: { id, deletedAt: null },
    include: leadDetailInclude,
  })
}

export async function updateLeadStage(id: string, stage: LeadStage) {
  return prisma.lead.update({
    where: { id },
    data: { stage, lastInteractionAt: new Date() },
    include: leadDetailInclude,
  })
}

export async function updateLead(id: string, data: Prisma.LeadUpdateInput) {
  return prisma.lead.update({
    where: { id },
    data: { ...data, lastInteractionAt: new Date() },
    include: leadDetailInclude,
  })
}

export async function createLeadInteraction(input: {
  leadId: string
  userId: string
  type: "CALL" | "WHATSAPP" | "EMAIL" | "VISIT" | "NOTE"
  description: string
}) {
  return prisma.$transaction([
    prisma.leadInteraction.create({ data: input }),
    prisma.lead.update({
      where: { id: input.leadId },
      data: { lastInteractionAt: new Date() },
    }),
  ])
}
