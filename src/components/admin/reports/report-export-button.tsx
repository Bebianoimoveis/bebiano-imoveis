"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { exportBusinessReportCsv } from "@/modules/report/actions"
import { actionErrorMessage } from "@/lib/action-error"

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function ReportExportButton({ months = 6 }: { months?: number }) {
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport() {
    setIsExporting(true)
    try {
      const csv = await exportBusinessReportCsv(months)
      downloadCsv(csv, `vendas-por-mes-${Date.now()}.csv`)
    } catch (error) {
      toast.error(actionErrorMessage(error, "Erro ao exportar."))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={isExporting} className="gap-1.5">
      <Download className="size-4" />
      Exportar
    </Button>
  )
}
