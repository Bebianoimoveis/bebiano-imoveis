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
import { createProposal } from "@/modules/proposal/actions"
import { findPropertyByCode } from "@/modules/property/actions"
import {
  proposalInputSchema,
  type ProposalFormValues,
  type ProposalInput,
} from "@/modules/proposal/schema"

type RealtorOption = { id: string; user: { name: string } }
type ClientOption = { id: string; name: string }

type ProposalFormDialogProps = {
  trigger: React.ReactNode
  realtors: RealtorOption[]
  clients: ClientOption[]
  leadId?: string
  fixedPropertyId?: string
  fixedPropertyLabel?: string
  fixedClientId?: string
}

export function ProposalFormDialog({
  trigger,
  realtors,
  clients,
  leadId,
  fixedPropertyId,
  fixedPropertyLabel,
  fixedClientId,
}: ProposalFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [propertyCode, setPropertyCode] = useState("")
  const [resolvedProperty, setResolvedProperty] = useState<
    { id: string; title: string; code: string } | null
  >(null)
  const [propertyError, setPropertyError] = useState<string | null>(null)

  const form = useForm<ProposalFormValues, unknown, ProposalInput>({
    resolver: zodResolver(proposalInputSchema),
    defaultValues: {
      propertyId: fixedPropertyId ?? "",
      clientId: fixedClientId ?? "",
      realtorId: realtors[0]?.id ?? "",
      leadId,
      value: "" as unknown as number,
      notes: "",
    },
  })

  async function handleLookupProperty() {
    setPropertyError(null)
    const property = await findPropertyByCode(propertyCode.trim())
    if (!property) {
      setPropertyError("Imóvel não encontrado com esse código.")
      setResolvedProperty(null)
      form.setValue("propertyId", "")
      return
    }
    setResolvedProperty(property)
    form.setValue("propertyId", property.id)
  }

  async function onSubmit(values: ProposalInput) {
    setIsSubmitting(true)
    try {
      await createProposal(values)
      toast.success("Proposta criada.")
      setOpen(false)
      form.reset()
      setResolvedProperty(null)
      setPropertyCode("")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar proposta.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova proposta</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {fixedPropertyId ? (
              <p className="text-sm text-muted-foreground">
                Imóvel: {fixedPropertyLabel}
              </p>
            ) : (
              <div className="space-y-1.5">
                <FormLabel>Código do imóvel</FormLabel>
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
                {resolvedProperty ? (
                  <p className="text-sm text-primary">{resolvedProperty.title}</p>
                ) : null}
                {propertyError ? (
                  <p className="text-sm text-destructive">{propertyError}</p>
                ) : null}
              </div>
            )}

            {!fixedClientId ? (
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

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
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor proposto</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
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
                {isSubmitting ? "Salvando..." : "Criar proposta"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
