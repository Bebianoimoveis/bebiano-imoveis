"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
import { createTestimonial, updateTestimonial } from "@/modules/testimonial/actions"

type FormValues = {
  name: string
  city: string
  rating: string
  message: string
  photoUrl: string
  published: boolean
  order: string
}

type TestimonialFormDialogProps = {
  trigger: React.ReactNode
  mode: "create" | "edit"
  testimonialId?: string
  defaultValues?: {
    name: string
    city: string | null
    rating: number
    message: string
    photoUrl: string | null
    published: boolean
    order: number
  }
}

export function TestimonialFormDialog({
  trigger,
  mode,
  testimonialId,
  defaultValues,
}: TestimonialFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    defaultValues: {
      name: defaultValues?.name ?? "",
      city: defaultValues?.city ?? "",
      rating: String(defaultValues?.rating ?? 5),
      message: defaultValues?.message ?? "",
      photoUrl: defaultValues?.photoUrl ?? "",
      published: defaultValues?.published ?? true,
      order: String(defaultValues?.order ?? 0),
    },
  })

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    try {
      const payload = {
        name: values.name,
        city: values.city || undefined,
        rating: values.rating,
        message: values.message,
        photoUrl: values.photoUrl || undefined,
        published: values.published,
        order: values.order,
      }

      if (mode === "create") {
        await createTestimonial(payload)
        toast.success("Depoimento criado.")
      } else if (testimonialId) {
        await updateTestimonial(testimonialId, payload)
        toast.success("Depoimento atualizado.")
      }
      setOpen(false)
      if (mode === "create") form.reset()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar depoimento.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Novo depoimento" : "Editar depoimento"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...form.register("name", { required: true, minLength: 2 })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">Cidade (opcional)</Label>
              <Input id="city" {...form.register("city")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Avaliação</Label>
              <Controller
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 4, 3, 2, 1].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {"★".repeat(n)}
                          {"☆".repeat(5 - n)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="order">Ordem de exibição</Label>
              <Input id="order" type="number" step={1} {...form.register("order")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="photoUrl">URL da foto (opcional)</Label>
            <Input id="photoUrl" {...form.register("photoUrl")} placeholder="https://..." />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="message">Depoimento</Label>
            <Textarea id="message" rows={4} {...form.register("message", { required: true, minLength: 10 })} />
          </div>

          <div className="flex items-center gap-2">
            <Controller
              control={form.control}
              name="published"
              render={({ field }) => (
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="size-4 rounded border-border"
                />
              )}
            />
            <Label className="font-normal">Publicado no site</Label>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
