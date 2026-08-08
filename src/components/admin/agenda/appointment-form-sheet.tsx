"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertTriangle, Search, X } from "lucide-react"

import { Sheet } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { APPOINTMENT_TYPE_OPTIONS } from "@/components/admin/agenda/appointment-type-badge"
import {
  createAppointment,
  updateAppointment,
  checkAppointmentConflict,
} from "@/modules/appointment/actions"
import { suggestLeads } from "@/modules/lead/actions"
import { suggestClients } from "@/modules/client/actions"
import { findPropertyByCode } from "@/modules/property/actions"
import type { AppointmentListItem } from "@/modules/appointment/repository"
import type { AppointmentType } from "@/generated/prisma/client"

type RealtorOption = { id: string; user: { name: string } }
type LinkedItem = { id: string; label: string }

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120]

function toDatetimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// Combobox mínimo pra vincular lead/cliente por busca — mesmo espírito
// do padrão search-with-suggestions (LeadSearch/ClientSearch), só que
// selecionar um resultado define o vínculo em vez de navegar.
function LinkCombobox({
  label,
  placeholder,
  value,
  onChange,
  search,
}: {
  label: string
  placeholder: string
  value: LinkedItem | null
  onChange: (item: LinkedItem | null) => void
  search: (query: string) => Promise<{ id: string; label: string }[]>
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{ id: string; label: string }[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    const timeout = setTimeout(() => search(query).then(setResults), 200)
    return () => clearTimeout(timeout)
  }, [query, search])

  if (value) {
    return (
      <div className="space-y-1.5">
        <Label>{label}</Label>
        <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
          <span>{value.label}</span>
          <button type="button" onClick={() => onChange(null)} aria-label={`Remover ${label}`}>
            <X className="size-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative space-y-1.5">
      <Label>{label}</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="pl-8"
        />
      </div>
      {open && results.length > 0 ? (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              onMouseDown={() => {
                onChange(result)
                setQuery("")
                setResults([])
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-secondary"
            >
              {result.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function AppointmentFormSheet({
  open,
  onOpenChange,
  realtors,
  appointment,
  defaultScheduledAt,
  leadId,
  clientId,
  propertyId,
  contextLabel,
  currentRealtorId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  realtors: RealtorOption[]
  appointment?: AppointmentListItem | null
  defaultScheduledAt?: Date
  leadId?: string
  clientId?: string
  propertyId?: string
  contextLabel?: string
  /** Corretor do usuário logado, se ele próprio for um — pré-seleciona só
   *  a si mesmo. Sem isso o campo começa vazio; nunca cai num corretor
   *  qualquer (ex.: o primeiro da lista) sem o usuário escolher. */
  currentRealtorId?: string | null
}) {
  const router = useRouter()
  const isEditing = !!appointment
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [realtorId, setRealtorId] = useState("")
  const [type, setType] = useState<AppointmentType>("VISIT")
  const [scheduledAt, setScheduledAt] = useState("")
  const [duration, setDuration] = useState(60)
  const [notes, setNotes] = useState("")
  const [lead, setLead] = useState<LinkedItem | null>(null)
  const [client, setClient] = useState<LinkedItem | null>(null)
  const [propertyCode, setPropertyCode] = useState("")
  const [property, setProperty] = useState<LinkedItem | null>(null)
  const [conflicts, setConflicts] = useState<{ id: string; label: string; time: string }[]>([])

  useEffect(() => {
    if (!open) return
    if (appointment) {
      setRealtorId(appointment.realtorId)
      setType(appointment.type)
      setScheduledAt(toDatetimeLocal(new Date(appointment.scheduledAt)))
      setDuration(appointment.durationMinutes)
      setNotes(appointment.notes ?? "")
      setLead(appointment.lead ? { id: appointment.lead.id, label: appointment.lead.name } : null)
      setClient(appointment.client ? { id: appointment.client.id, label: appointment.client.name } : null)
      setProperty(
        appointment.property
          ? { id: appointment.property.id, label: `${appointment.property.code} · ${appointment.property.title}` }
          : null
      )
    } else {
      setRealtorId(currentRealtorId ?? "")
      setType("VISIT")
      setScheduledAt(toDatetimeLocal(defaultScheduledAt ?? new Date()))
      setDuration(60)
      setNotes("")
      setLead(null)
      setClient(null)
      setProperty(null)
      setPropertyCode("")
    }
    setConflicts([])
  }, [open, appointment, defaultScheduledAt, realtors, currentRealtorId])

  useEffect(() => {
    if (!realtorId || !scheduledAt) return
    const timeout = setTimeout(() => {
      checkAppointmentConflict({
        realtorId,
        scheduledAt,
        durationMinutes: duration,
        excludeId: appointment?.id,
      }).then((rows) =>
        setConflicts(
          rows.map((row) => ({
            id: row.id,
            label: row.lead?.name ?? row.client?.name ?? "Compromisso",
            time: new Date(row.scheduledAt).toLocaleString("pt-BR"),
          }))
        )
      )
    }, 300)
    return () => clearTimeout(timeout)
  }, [realtorId, scheduledAt, duration, appointment?.id])

  async function handleLookupProperty() {
    const found = await findPropertyByCode(propertyCode.trim())
    if (!found) {
      toast.error("Imóvel não encontrado com esse código.")
      return
    }
    setProperty({ id: found.id, label: `${found.code} · ${found.title}` })
    setPropertyCode("")
  }

  async function handleSubmit() {
    if (!realtorId || !scheduledAt) {
      toast.error("Informe corretor e data/hora.")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        realtorId,
        type,
        scheduledAt: new Date(scheduledAt),
        durationMinutes: duration,
        notes,
        leadId: lead?.id ?? leadId,
        clientId: client?.id ?? clientId,
        propertyId: property?.id ?? propertyId,
      }

      if (isEditing) {
        await updateAppointment(appointment.id, payload)
        toast.success("Compromisso atualizado.")
      } else {
        await createAppointment(payload)
        toast.success("Compromisso agendado.")
      }
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar compromisso.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      side="right"
      title={isEditing ? "Editar compromisso" : "Novo compromisso"}
    >
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {contextLabel ? <p className="text-sm text-muted-foreground">{contextLabel}</p> : null}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Corretor</Label>
            <Select value={realtorId} onValueChange={setRealtorId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {realtors.map((realtor) => (
                  <SelectItem key={realtor.id} value={realtor.id}>
                    {realtor.user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as AppointmentType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPOINTMENT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Data e hora</Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Duração</Label>
            <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((minutes) => (
                  <SelectItem key={minutes} value={String(minutes)}>
                    {minutes} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {conflicts.length > 0 ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            <div>
              <p className="font-medium">Conflito de horário com este corretor:</p>
              {conflicts.map((conflict) => (
                <p key={conflict.id}>
                  {conflict.label} · {conflict.time}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        {!leadId ? (
          <LinkCombobox
            label="Lead vinculado (opcional)"
            placeholder="Buscar lead por nome ou telefone"
            value={lead}
            onChange={setLead}
            search={async (query) => {
              const rows = await suggestLeads(query)
              return rows.map((row) => ({ id: row.id, label: `${row.name} · ${row.phone}` }))
            }}
          />
        ) : null}

        {!clientId ? (
          <LinkCombobox
            label="Cliente vinculado (opcional)"
            placeholder="Buscar cliente por nome ou código"
            value={client}
            onChange={setClient}
            search={async (query) => {
              const rows = await suggestClients(query)
              return rows.map((row) => ({ id: row.id, label: `${row.name} · ${row.code}` }))
            }}
          />
        ) : null}

        {!propertyId ? (
          <div className="space-y-1.5">
            <Label>Imóvel vinculado (opcional)</Label>
            {property ? (
              <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
                <span>{property.label}</span>
                <button type="button" onClick={() => setProperty(null)} aria-label="Remover imóvel">
                  <X className="size-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={propertyCode}
                  onChange={(e) => setPropertyCode(e.target.value)}
                  placeholder="Ex: BB-1024"
                />
                <Button type="button" variant="outline" onClick={handleLookupProperty}>
                  Buscar
                </Button>
              </div>
            )}
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label>Observações</Label>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      <div className="border-t border-border/60 p-4">
        <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : isEditing ? "Salvar alterações" : "Agendar compromisso"}
        </Button>
      </div>
    </Sheet>
  )
}
