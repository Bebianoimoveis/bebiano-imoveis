import { z } from "zod"

export const APPOINTMENT_STATUSES = [
  "SCHEDULED",
  "CONFIRMED",
  "DONE",
  "CANCELED",
  "NO_SHOW",
] as const

export const appointmentInputSchema = z.object({
  realtorId: z.string().min(1, "Selecione o corretor."),
  scheduledAt: z.coerce.date(),
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
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
})

export type AppointmentFilters = z.infer<typeof appointmentFiltersSchema>
