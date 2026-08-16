import * as notificationRepository from "@/modules/notification/repository"

// Melhor esforço: uma falha ao gravar notificação nunca pode derrubar o
// fluxo principal (criar lead, criar imóvel) que disparou o aviso.
export async function notifyNewLead(
  lead: { id: string; name: string; realtorId: string | null; origin: string },
  excludeUserId?: string
) {
  try {
    const recipientIds = new Set<string>()

    if (lead.realtorId) {
      const userId = await notificationRepository.findUserIdByRealtorId(lead.realtorId)
      if (userId) recipientIds.add(userId)
    }

    const adminIds = await notificationRepository.findUserIdsWithPermission("lead.view.all")
    adminIds.forEach((id) => recipientIds.add(id))

    if (excludeUserId) recipientIds.delete(excludeUserId)

    await Promise.all(
      [...recipientIds].map((userId) =>
        notificationRepository.createNotification({
          userId,
          title: "Novo lead",
          message: `${lead.name} chegou (${lead.origin}) e precisa de contato.`,
        })
      )
    )
  } catch (error) {
    console.error("notifyNewLead falhou", error)
  }
}

export async function notifyNewProperty(
  property: { id: string; title: string; code: string },
  creatorId: string
) {
  try {
    const recipientIds = (
      await notificationRepository.findUserIdsWithPermission("property.view.all")
    ).filter((id) => id !== creatorId)

    await Promise.all(
      recipientIds.map((userId) =>
        notificationRepository.createNotification({
          userId,
          title: "Novo imóvel captado",
          message: `${property.code} · ${property.title} foi cadastrado e está aguardando revisão.`,
        })
      )
    )
  } catch (error) {
    console.error("notifyNewProperty falhou", error)
  }
}
