"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { ImageOff, Trash2 } from "lucide-react"

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
import { createTestimonialPhotoUploadSignature } from "@/modules/upload/actions"
import { uploadPropertyImage } from "@/modules/upload/client"

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
  const [isUploading, setIsUploading] = useState(false)

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

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const signature = await createTestimonialPhotoUploadSignature()
      const uploaded = await uploadPropertyImage(file, signature)
      form.setValue("photoUrl", uploaded.url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar foto.")
    } finally {
      setIsUploading(false)
      e.target.value = ""
    }
  }

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
            <Label>Foto (opcional)</Label>
            <Controller
              control={form.control}
              name="photoUrl"
              render={({ field }) => (
                <div className="flex items-center gap-3">
                  <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-muted-foreground">
                    {field.value ? (
                      <Image src={field.value} alt="Foto do depoimento" fill className="object-cover" sizes="56px" />
                    ) : (
                      <ImageOff className="size-4" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      disabled={isUploading}
                    />
                    {isUploading ? (
                      <p className="text-xs text-muted-foreground">Enviando...</p>
                    ) : field.value ? (
                      <button
                        type="button"
                        onClick={() => field.onChange("")}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3" /> Remover
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
            />
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
