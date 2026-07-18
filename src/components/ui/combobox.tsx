"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export type ComboboxOption = {
  value: string
  label: string
}

// Select pesquisável para listas longas (ex.: cidades). Usa cmdk — a base
// do padrão "Command" do shadcn/Linear/Vercel — em vez de filtrar na mão,
// o que já resolve navegação por teclado, ranking de busca e acessibilidade.
export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum resultado encontrado.",
  className,
  triggerClassName,
}: {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  triggerClassName?: string
}) {
  const [open, setOpen] = React.useState(false)
  const selected = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent px-3 py-2 text-sm whitespace-nowrap transition-all duration-200 outline-none select-none hover:border-foreground/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-placeholder:text-muted-foreground",
            triggerClassName
          )}
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDownIcon
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out",
              open && "rotate-180"
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn("w-(--radix-popover-trigger-width) p-0", className)}
      >
        <CommandPrimitive className="flex flex-col">
          <div className="flex items-center gap-2 border-b border-border/60 px-3">
            <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
            <CommandPrimitive.Input
              placeholder={searchPlaceholder}
              className="flex h-10 w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandPrimitive.List className="max-h-64 overflow-y-auto p-1.5">
            <CommandPrimitive.Empty className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </CommandPrimitive.Empty>
            {options.map((option) => {
              const isSelected = option.value === value
              return (
                <CommandPrimitive.Item
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange(option.value)
                    setOpen(false)
                  }}
                  className="group/combobox-item relative flex cursor-pointer items-center gap-2 rounded-lg py-1.5 pr-2.5 pl-2.5 text-sm outline-hidden select-none transition-all duration-150 ease-out data-[selected=true]:translate-x-0.5 data-[selected=true]:bg-primary/8"
                >
                  <span className="flex size-4 items-center justify-center text-gold-dark">
                    {isSelected ? (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                      >
                        <CheckIcon className="size-3.5" />
                      </motion.span>
                    ) : null}
                  </span>
                  {option.label}
                </CommandPrimitive.Item>
              )
            })}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </PopoverContent>
    </Popover>
  )
}
