import { z } from "zod"

export const APPOINTMENT_STATUSES = [
  "SCHEDULED",
  "CONFIRMED",
  "DONE",
  "CANCELED",
  "NO_SHOW",
] as const

export const APPOINTMENT_TYPES = ["VISIT", "CALL", "RETURN", "OTHER"] as const

export const appointmentInputSchema = z.object({
  realtorId: z.string().min(1, "Selecione o corretor."),
  scheduledAt: z.coerce.date(),
  durationMinutes: z.coerce.number().int().positive().default(60),
  type: z.enum(APPOINTMENT_TYPES).default("VISIT"),
  notes: z.string().max(2000).optional(),
  leadId: z.string().optional(),
  clientId: z.string().optional(),
  propertyId: z.string().optional(),
})

export type AppointmentFormValues = z.input<typeof appointmentInputSchema>
export type AppointmentInput = z.output<typeof appointmentInputSchema>

export const appointmentFiltersSchema = z.object({
  realtorId: z.string().optional(),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  type: z.enum(APPOINTMENT_TYPES).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  // "Meu Dia" — força o escopo pro corretor logado mesmo quando ele tem
  // appointment.view.all (por padrão só filtra a visão, não muda quem
  // pode ver o quê).
  mine: z.coerce.boolean().optional(),
})

export type AppointmentFilters = z.infer<typeof appointmentFiltersSchema>

// Reagendamento via drag-and-drop — só o essencial que muda ao soltar o
// bloco num novo horário/dia.
export const appointmentRescheduleSchema = z.object({
  scheduledAt: z.coerce.date(),
})

export type AppointmentRescheduleInput = z.output<typeof appointmentRescheduleSchema>
