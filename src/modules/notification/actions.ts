"use server"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { formatCurrency } from "@/lib/format"
import * as notificationRepository from "@/modules/notification/repository"
import * as financialRepository from "@/modules/financial/repository"
import { listAdminAppointments } from "@/modules/appointment/actions"

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new Error("Não autenticado.")
  return session
}

export type NotificationView = {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: Date
  // "reminder" = calculado na hora (agenda/vencimento), some sozinho
  // quando a condição deixa de valer — não fica gravado no banco nem
  // pode ser marcado como lido individualmente.
  kind: "event" | "reminder"
}

const DUE_SOON_DAYS = 3

// Lembretes de agenda/vencimento não são eventos — são um estado que vale
// "enquanto durar". Calcular na hora (em vez de gravar e ter que manter
// sincronizado com um cron) segue o mesmo padrão já usado pro "atrasado"
// dos lançamentos financeiros (ver financial/repository.ts).
async function buildLiveReminders(
  session: Awaited<ReturnType<typeof requireSession>>
): Promise<NotificationView[]> {
  const reminders: NotificationView[] = []

  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)

  try {
    const appointments = await listAdminAppointments({ from: startOfDay, to: endOfDay })
    for (const appointment of appointments) {
      if (appointment.status === "CANCELED" || appointment.status === "DONE" || appointment.status === "NO_SHOW") {
        continue
      }
      const time = new Date(appointment.scheduledAt).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
      const withWho = appointment.lead?.name ?? appointment.client?.name ?? "sem contato vinculado"
      reminders.push({
        id: `appointment:${appointment.id}`,
        title: "Compromisso hoje",
        message: `${time} · ${withWho}`,
        read: false,
        createdAt: new Date(appointment.scheduledAt),
        kind: "reminder",
      })
    }
  } catch {
    // Sem permissão de agenda pro usuário atual — sem lembrete, sem
    // quebrar o resto do sino.
  }

  if (await can(session.user, "financial.view")) {
    const dueSoon = await financialRepository.listEntriesDueSoon(DUE_SOON_DAYS)
    for (const entry of dueSoon) {
      const isOverdue = new Date(entry.dueDate) < startOfDay
      reminders.push({
        id: `financial:${entry.id}`,
        title: isOverdue ? "Vencimento atrasado" : "Vencimento próximo",
        message: `${entry.category} · ${formatCurrency(entry.amount.toString())} · vence em ${new Date(entry.dueDate).toLocaleDateString("pt-BR")}`,
        read: false,
        createdAt: new Date(entry.dueDate),
        kind: "reminder",
      })
    }
  }

  return reminders
}

export async function listMyNotifications(): Promise<NotificationView[]> {
  const session = await requireSession()

  const [stored, reminders] = await Promise.all([
    notificationRepository.listNotifications(session.user.id, 20),
    buildLiveReminders(session),
  ])

  const events: NotificationView[] = stored.map((notification) => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    read: notification.read,
    createdAt: notification.createdAt,
    kind: "event",
  }))

  return [...reminders, ...events].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function markNotificationRead(id: string) {
  const session = await requireSession()
  if (id.startsWith("appointment:") || id.startsWith("financial:")) return
  await notificationRepository.markRead(id, session.user.id)
}

export async function markAllNotificationsRead() {
  const session = await requireSession()
  await notificationRepository.markAllRead(session.user.id)
}
