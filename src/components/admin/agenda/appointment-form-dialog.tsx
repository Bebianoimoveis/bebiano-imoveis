"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { createAppointment } from "@/modules/appointment/actions"
import {
  appointmentInputSchema,
  type AppointmentFormValues,
  type AppointmentInput,
} from "@/modules/appointment/schema"

type RealtorOption = { id: string; user: { name: string } }

type AppointmentFormDialogProps = {
  trigger: React.ReactNode
  realtors: RealtorOption[]
  contextLabel?: string
  leadId?: string
  clientId?: string
  propertyId?: string
}

export function AppointmentFormDialog({
  trigger,
  realtors,
  contextLabel,
  leadId,
  clientId,
  propertyId,
}: AppointmentFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<AppointmentFormValues, unknown, AppointmentInput>({
    resolver: zodResolver(appointmentInputSchema),
    defaultValues: {
      realtorId: realtors[0]?.id ?? "",
      scheduledAt: "" as unknown as Date,
      notes: "",
      leadId,
      clientId,
      propertyId,
    },
  })

  async function onSubmit(values: AppointmentInput) {
    setIsSubmitting(true)
    try {
      await createAppointment(values)
      toast.success("Compromisso agendado.")
      setOpen(false)
      form.reset()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao agendar.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo compromisso</DialogTitle>
        </DialogHeader>

        {contextLabel ? (
          <p className="text-sm text-muted-foreground">{contextLabel}</p>
        ) : null}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="realtorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Corretor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {realtors.map((realtor) => (
                        <SelectItem key={realtor.id} value={realtor.id}>
                          {realtor.user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduledAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data e hora</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      required
                      value={String(field.value ?? "")}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Agendar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
