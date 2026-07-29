"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Download, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { exportPropertiesCsv } from "@/modules/property/actions"

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function PropertyHeaderActions() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isExporting, setIsExporting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  async function handleExport() {
    setIsExporting(true)
    try {
      const filters = Object.fromEntries(searchParams.entries())
      const csv = await exportPropertiesCsv({ rawFilters: filters })
      downloadCsv(csv, `imoveis-${Date.now()}.csv`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao exportar.")
    } finally {
      setIsExporting(false)
    }
  }

  function handleRefresh() {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  return (
    <>
      <Button variant="outline" onClick={handleExport} disabled={isExporting} className="gap-1.5">
        <Download className="size-4" />
        Exportar
      </Button>
      <Button variant="outline" onClick={handleRefresh} className="gap-1.5" aria-label="Atualizar">
        <RefreshCw className={isRefreshing ? "size-4 animate-spin" : "size-4"} />
      </Button>
    </>
  )
}
