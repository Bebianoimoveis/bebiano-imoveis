"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Download } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { exportAppointmentsIcs } from "@/modules/appointment/actions"

function downloadIcs(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// Interpretação honesta de "Google Calendar Ready" sem OAuth/API paga —
// baixa um .ics padrão que qualquer app de calendário importa
// manualmente (Google, Apple, Outlook).
export function AppointmentIcsButton() {
  const searchParams = useSearchParams()
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport() {
    setIsExporting(true)
    try {
      const filters = Object.fromEntries(searchParams.entries())
      const ics = await exportAppointmentsIcs(filters)
      downloadIcs(ics, `agenda-${Date.now()}.ics`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao exportar.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={isExporting} className="gap-1.5">
      <Download className="size-4" />
      Exportar .ics
    </Button>
  )
}
