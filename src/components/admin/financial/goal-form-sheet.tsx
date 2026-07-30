"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Sheet } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { saveGoal } from "@/modules/goal/actions"
import { goalInputSchema, type GoalFormValues, type GoalInput } from "@/modules/goal/schema"

type RealtorOption = { id: string; user: { name: string } }
type CityOption = { id: string; name: string; state: string }

const NONE = "__none__"

export function GoalFormSheet({
  open,
  onOpenChange,
  defaultYear,
  realtors,
  cities,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultYear: number
  realtors: RealtorOption[]
  cities: CityOption[]
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<GoalFormValues, unknown, GoalInput>({
    resolver: zodResolver(goalInputSchema),
    defaultValues: {
      scope: "COMPANY",
      year: defaultYear,
      targetAmount: "" as unknown as number,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({ scope: "COMPANY", year: defaultYear, targetAmount: "" as unknown as number })
    }
  }, [open, defaultYear, form])

  const scope = form.watch("scope")

  async function onSubmit(values: GoalInput) {
    setIsSubmitting(true)
    try {
      await saveGoal(values)
      toast.success("Meta salva.")
      onOpenChange(false)
      router.refresh()
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar meta.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right" title="Nova meta" className="w-full max-w-md">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-4 p-5">
            <FormField
              control={form.control}
              name="scope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Escopo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="COMPANY">Empresa</SelectItem>
                      <SelectItem value="REALTOR">Corretor</SelectItem>
                      <SelectItem value="CITY">Cidade</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {scope === "REALTOR" ? (
              <FormField
                control={form.control}
                name="realtorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Corretor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione..." />
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
            ) : null}

            {scope === "CITY" ? (
              <FormField
                control={form.control}
                name="cityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.name} - {city.state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano</FormLabel>
                    <FormControl>
                      <Input type="number" value={String(field.value ?? "")} onChange={(e) => field.onChange(e.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mês (opcional)</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === NONE ? undefined : v)}
                      value={field.value ? String(field.value) : NONE}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>Meta anual</SelectItem>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                          <SelectItem key={month} value={String(month)}>
                            {String(month).padStart(2, "0")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor da meta</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" value={String(field.value ?? "")} onChange={(e) => field.onChange(e.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="border-t border-border/60 p-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar meta"}
            </Button>
          </div>
        </form>
      </Form>
    </Sheet>
  )
}
