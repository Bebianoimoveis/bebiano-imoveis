"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Download } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { exportFinancialEntriesCsv } from "@/modules/financial/actions"

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function FinancialExportButton({ filters }: { filters?: Record<string, string> }) {
  const searchParams = useSearchParams()
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport() {
    setIsExporting(true)
    try {
      const source = filters ?? Object.fromEntries(searchParams.entries())
      const csv = await exportFinancialEntriesCsv(source)
      downloadCsv(csv, `financeiro-${Date.now()}.csv`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao exportar.")
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
