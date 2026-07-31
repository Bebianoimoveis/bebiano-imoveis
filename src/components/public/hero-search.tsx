"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { motion } from "motion/react"
import { Building2, Home as HomeIcon, KeyRound, Search, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Combobox } from "@/components/ui/combobox"
import { cn } from "@/lib/utils"

type City = { id: string; name: string; state: string }
type PropertyType = { id: string; name: string }

type Finalidade = "SALE" | "RENT" | "LAUNCH"

const FINALIDADES: { value: Finalidade; label: string; icon: typeof HomeIcon }[] = [
  { value: "SALE", label: "Comprar", icon: HomeIcon },
  { value: "RENT", label: "Alugar", icon: KeyRound },
  { value: "LAUNCH", label: "Lançamentos", icon: Sparkles },
]

export function HeroSearch({
  cities,
  propertyTypes,
}: {
  cities: City[]
  propertyTypes: PropertyType[]
}) {
  const router = useRouter()
  const [finalidade, setFinalidade] = useState<Finalidade>("SALE")
  const [typeId, setTypeId] = useState<string>("")
  const [cityId, setCityId] = useState<string>("")
  const [search, setSearch] = useState<string>("")

  function handleSearch() {
    const params = new URLSearchParams()
    if (typeId) params.set("typeId", typeId)
    if (cityId) params.set("cityId", cityId)
    if (search.trim()) params.set("search", search.trim())
    if (finalidade === "LAUNCH") params.set("isLaunch", "true")

    const basePath = finalidade === "RENT" ? "/alugar" : "/comprar"
    const query = params.toString()
    router.push(query ? `${basePath}?${query}` : basePath)
  }

  return (
    <div className="rounded-3xl border border-white/15 bg-white/8 p-2.5 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:rounded-[2rem] sm:p-3">
      {/* Toggle de finalidade — pill switch, não um <select> */}
      <div className="mb-2.5 flex gap-1.5 overflow-x-auto rounded-2xl bg-black/20 p-1.5 sm:mb-3">
        {FINALIDADES.map((option) => {
          const Icon = option.icon
          const active = finalidade === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setFinalidade(option.value)}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors duration-300 sm:px-4 sm:text-sm",
                active ? "text-primary-foreground" : "text-white/70 hover:text-white"
              )}
            >
              {active ? (
                <motion.span
                  layoutId="hero-finalidade-pill"
                  className="absolute inset-0 rounded-xl bg-gold"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              ) : null}
              <Icon className={cn("relative z-10 size-3.5", active && "text-accent-foreground")} />
              <span className={cn("relative z-10", active && "text-accent-foreground")}>
                {option.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Campos */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Combobox
            value={typeId}
            onValueChange={setTypeId}
            placeholder="Tipo de imóvel"
            searchPlaceholder="Buscar tipo..."
            emptyMessage="Nenhum tipo encontrado."
            triggerClassName="h-12 w-full rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 sm:h-13"
            options={propertyTypes.map((type) => ({ value: type.id, label: type.name }))}
          />
        </div>

        <div className="flex-1">
          <Combobox
            value={cityId}
            onValueChange={setCityId}
            placeholder="Cidade"
            searchPlaceholder="Buscar cidade..."
            emptyMessage="Nenhuma cidade encontrada."
            triggerClassName="h-12 w-full rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 sm:h-13"
            options={cities.map((city) => ({
              value: city.id,
              label: `${city.name} - ${city.state}`,
            }))}
          />
        </div>

        <div className="relative flex-[1.4]">
          <Building2 className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch()
            }}
            placeholder="Bairro, condomínio ou palavra-chave"
            className="h-12 rounded-xl border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40 focus-visible:border-gold/60 focus-visible:ring-gold/20 sm:h-13"
          />
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }}>
          <Button
            onClick={handleSearch}
            size="lg"
            className="h-12 w-full rounded-xl bg-gold text-accent-foreground shadow-lg shadow-black/20 hover:bg-gold-light sm:h-13 sm:w-auto sm:px-7"
          >
            <Search className="size-4" />
            Buscar imóveis
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
