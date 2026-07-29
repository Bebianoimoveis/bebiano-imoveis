"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { Archive, Download, Sparkles, User, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  bulkArchiveProperties,
  bulkChangePropertyStatus,
  bulkReassignPropertyRealtor,
  exportPropertiesCsv,
} from "@/modules/property/actions"

type RealtorOption = { id: string; user: { name: string } }

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function PropertyBulkToolbar({
  selectedIds,
  realtors,
  onClear,
}: {
  selectedIds: string[]
  realtors: RealtorOption[]
  onClear: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isExporting, setIsExporting] = useState(false)

  function run(action: () => Promise<unknown>, successMessage: string) {
    startTransition(async () => {
      try {
        await action()
        toast.success(successMessage)
        onClear()
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro inesperado.")
      }
    })
  }

  async function handleExport() {
    setIsExporting(true)
    try {
      const csv = await exportPropertiesCsv({ ids: selectedIds })
      downloadCsv(csv, `imoveis-selecionados-${Date.now()}.csv`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao exportar.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <AlertDialog>
      <AnimatePresence>
        {selectedIds.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-border bg-popover px-4 py-3 shadow-2xl"
          >
            <span className="text-sm font-medium">
              {selectedIds.length} selecionado{selectedIds.length > 1 ? "s" : ""}
            </span>

            <div className="h-5 w-px bg-border" />

            <Button
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() =>
                run(() => bulkChangePropertyStatus(selectedIds, "PUBLISHED"), "Imóveis publicados.")
              }
              className="gap-1.5"
            >
              <Sparkles className="size-4" /> Publicar
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isPending} className="gap-1.5">
                  <User className="size-4" /> Alterar corretor
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                {realtors.map((realtor) => (
                  <DropdownMenuItem
                    key={realtor.id}
                    onClick={() =>
                      run(
                        () => bulkReassignPropertyRealtor(selectedIds, realtor.id),
                        "Corretor atualizado."
                      )
                    }
                  >
                    {realtor.user.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              disabled={isExporting}
              onClick={handleExport}
              className="gap-1.5"
            >
              <Download className="size-4" /> Exportar
            </Button>

            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" disabled={isPending} className="gap-1.5 text-destructive hover:text-destructive">
                <Archive className="size-4" /> Arquivar
              </Button>
            </AlertDialogTrigger>

            <div className="h-5 w-px bg-border" />

            <button
              type="button"
              aria-label="Limpar seleção"
              onClick={onClear}
              className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Arquivar {selectedIds.length} imóveis?</AlertDialogTitle>
          <AlertDialogDescription>
            Eles saem do site e da listagem ativa. É o mesmo que arquivar um por um — não existe
            exclusão definitiva no sistema, então isso pode ser revertido depois filtrando por
            status &ldquo;Arquivado&rdquo;.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel />
          <AlertDialogAction
            onClick={() => run(() => bulkArchiveProperties(selectedIds), "Imóveis arquivados.")}
          >
            Arquivar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
