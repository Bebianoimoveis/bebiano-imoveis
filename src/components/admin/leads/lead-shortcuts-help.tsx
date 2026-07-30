"use client"

import { useEffect, useState } from "react"
import { Keyboard } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const SHORTCUTS = [
  { keys: "Ctrl/Cmd + K", label: "Busca global" },
  { keys: "Ctrl/Cmd + N", label: "Novo lead" },
  { keys: "Ctrl/Cmd + /", label: "Atalhos" },
]

export function LeadShortcutsHelp() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Atalhos de teclado"
          className="flex size-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Keyboard className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">Atalhos</p>
        <div className="space-y-1.5">
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.keys} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{shortcut.label}</span>
              <kbd className="rounded-md border border-border/60 bg-secondary px-1.5 py-0.5 text-xs font-medium">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
