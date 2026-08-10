"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "cmdk"
import { Bell, Building2, Contact, Menu, Moon, Search, Sparkles, Users2 } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AssistantPanel } from "@/components/admin/assistant/assistant-panel"
import { signOutAction } from "@/modules/auth/actions"
import { globalSearch, type GlobalSearchResult } from "@/modules/search/actions"
import { cn } from "@/lib/utils"

export type AdminTopbarUser = {
  name?: string | null
  email?: string | null
  roleName: string
}

const RESULT_ICON = {
  property: Building2,
  lead: Users2,
  client: Contact,
} as const

const RESULT_GROUP_LABEL = {
  property: "Imóveis",
  lead: "Leads",
  client: "Clientes",
} as const

function initials(name?: string | null) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase()
}

function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GlobalSearchResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    const timeout = setTimeout(() => {
      globalSearch(query)
        .then(setResults)
        .finally(() => setLoading(false))
    }, 220)
    return () => clearTimeout(timeout)
  }, [query])

  const grouped = results.reduce<Record<string, GlobalSearchResult[]>>((acc, result) => {
    ;(acc[result.type] ??= []).push(result)
    return acc
  }, {})

  return (
    <>
      {/* No mobile vira só o ícone (a barra com texto some) — não tem
          espaço sobrando na topbar ao lado do menu hambúrguer e dos
          ícones à direita. */}
      <button
        type="button"
        aria-label="Buscar"
        onClick={() => setOpen(true)}
        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:hidden"
      >
        <Search className="size-[18px]" />
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden w-full max-w-md items-center gap-2 rounded-xl border border-border/60 bg-secondary/40 px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-secondary/70 sm:flex"
      >
        <Search className="size-4" />
        <span className="flex-1 truncate text-left">Buscar imóveis, leads, clientes…</span>
        <kbd className="rounded-md border border-border/60 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setQuery("")
        }}
        overlayClassName="fixed inset-0 z-50 bg-black/70"
        className="fixed top-[18%] left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl"
        shouldFilter={false}
      >
        <div className="flex items-center gap-2 border-b border-border/60 px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Buscar imóveis, leads, clientes…"
            className="flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <CommandList className="max-h-80 overflow-y-auto p-2">
          {!loading && query.trim().length >= 2 && results.length === 0 ? (
            <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
              Nenhum resultado para &ldquo;{query}&rdquo;.
            </CommandEmpty>
          ) : null}
          {query.trim().length < 2 ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              Digite ao menos 2 letras para buscar.
            </p>
          ) : null}
          {(Object.keys(grouped) as Array<keyof typeof RESULT_GROUP_LABEL>).map((type) => (
            <CommandGroup
              key={type}
              heading={RESULT_GROUP_LABEL[type]}
              className="mb-1 px-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase [&_[cmdk-group-items]]:mt-1"
            >
              {grouped[type].map((result) => {
                const Icon = RESULT_ICON[result.type]
                return (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    value={`${result.type}-${result.id}`}
                    onSelect={() => {
                      setOpen(false)
                      setQuery("")
                      router.push(result.href)
                    }}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm",
                      "data-[selected=true]:bg-secondary"
                    )}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">{result.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{result.subtitle}</span>
                    </span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}

export function AdminTopbar({
  user,
  permissions,
  onOpenMobileSidebar,
}: {
  user: AdminTopbarUser
  permissions: Set<string>
  onOpenMobileSidebar: () => void
}) {
  const [assistantOpen, setAssistantOpen] = useState(false)
  const canUseAssistant = permissions.has("assistant.use")
  const firstName = user.name?.split(" ")[0] ?? "por aqui"

  return (
    <header className="flex h-16 items-center gap-4 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md md:px-8">
      <button
        type="button"
        aria-label="Abrir menu"
        onClick={onOpenMobileSidebar}
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
      >
        <Menu className="size-5" />
      </button>

      <GlobalSearch />

      <div className="ml-auto flex items-center gap-1.5">
        {canUseAssistant ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Bebiano IA"
                  onClick={() => setAssistantOpen(true)}
                  className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Sparkles className="size-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Bebiano IA</TooltipContent>
            </Tooltip>
            <AssistantPanel
              open={assistantOpen}
              onOpenChange={setAssistantOpen}
              firstName={firstName}
              permissionKeys={[...permissions]}
            />
          </>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Notificações"
              className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Bell className="size-[18px]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
              <Bell className="size-6 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">
                Nenhuma notificação por enquanto.
              </p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Tema (em breve)"
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors"
            >
              <Moon className="size-[18px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Tema claro em breve</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-1 flex items-center gap-2 rounded-full transition-opacity hover:opacity-80"
            >
              <Avatar size="sm">
                <AvatarFallback className="bg-primary/20 text-primary">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <span className="block truncate font-medium">{user.name}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {user.email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <form action={signOutAction}>
              <DropdownMenuItem asChild variant="destructive">
                <button type="submit" className="w-full">
                  Sair
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
