"use client"

import { useCallback, useEffect, useState } from "react"
import { Bell, CalendarClock, CircleDollarSign, UserPlus, Building2 } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatRelativeTime } from "@/lib/format"
import {
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationView,
} from "@/modules/notification/actions"

// Busca de novo toda vez que o menu abre + a cada 2min em segundo plano,
// pra contagem no sino não ficar visivelmente desatualizada sem precisar
// de WebSocket/polling agressivo pra um painel administrativo pequeno.
const POLL_INTERVAL_MS = 120_000

function iconFor(notification: NotificationView) {
  if (notification.id.startsWith("appointment:")) return CalendarClock
  if (notification.id.startsWith("financial:")) return CircleDollarSign
  if (notification.title === "Novo imóvel captado") return Building2
  return UserPlus
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationView[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const refresh = useCallback(() => {
    listMyNotifications()
      .then(setNotifications)
      .catch(() => {})
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [refresh])

  useEffect(() => {
    if (open) refresh()
  }, [open, refresh])

  const unreadCount = notifications.filter((n) => !n.read).length

  async function handleItemClick(notification: NotificationView) {
    if (notification.kind !== "event" || notification.read) return
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    )
    await markNotificationRead(notification.id).catch(() => {})
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => (n.kind === "event" ? { ...n, read: true } : n)))
    setLoading(true)
    await markAllNotificationsRead().catch(() => {})
    setLoading(false)
  }

  return (
    <DropdownMenu onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Notificações"
          className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Bell className="size-[18px]" />
          {unreadCount > 0 ? (
            <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-1">
          <DropdownMenuLabel className="px-0">Notificações</DropdownMenuLabel>
          {notifications.some((n) => n.kind === "event" && !n.read) ? (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={loading}
              className="px-2 py-1 text-xs text-primary hover:underline disabled:opacity-50"
            >
              Marcar todas como lidas
            </button>
          ) : null}
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
            <Bell className="size-6 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">Nenhuma notificação por enquanto.</p>
          </div>
        ) : (
          <div className="max-h-96 space-y-0.5 overflow-y-auto py-1">
            {notifications.map((notification) => {
              const Icon = iconFor(notification)
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleItemClick(notification)}
                  className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-secondary"
                >
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                    <Icon className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate font-medium text-foreground">{notification.title}</span>
                      {notification.kind === "event" && !notification.read ? (
                        <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                      ) : null}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {notification.message}
                    </span>
                    {notification.kind === "event" ? (
                      <span className="text-[11px] text-muted-foreground/70">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    ) : null}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
