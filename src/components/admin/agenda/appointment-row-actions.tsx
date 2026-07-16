"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal } from "lucide-react"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { updateAppointmentStatus } from "@/modules/appointment/actions"
import type { AppointmentStatus } from "@/generated/prisma/client"

const OPTIONS: { status: AppointmentStatus; label: string }[] = [
  { status: "CONFIRMED", label: "Confirmar" },
  { status: "DONE", label: "Marcar como realizado" },
  { status: "NO_SHOW", label: "Marcar não compareceu" },
  { status: "CANCELED", label: "Cancelar" },
]

export function AppointmentRowActions({
  appointmentId,
  status,
}: {
  appointmentId: string
  status: AppointmentStatus
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleChange(nextStatus: AppointmentStatus) {
    startTransition(async () => {
      try {
        await updateAppointmentStatus(appointmentId, nextStatus)
        toast.success("Status atualizado.")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao atualizar.")
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isPending}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OPTIONS.filter((option) => option.status !== status).map((option) => (
          <DropdownMenuItem key={option.status} onClick={() => handleChange(option.status)}>
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
