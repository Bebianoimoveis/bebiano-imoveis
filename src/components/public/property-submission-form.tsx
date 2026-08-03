"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { useForm, Controller } from "react-hook-form"
import { toast } from "sonner"
import { CheckCircle2, ImagePlus, Loader2, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createPropertySubmission } from "@/modules/submission/actions"
import { createSubmissionImageUploadSignature } from "@/modules/upload/actions"
import { uploadPropertyImage } from "@/modules/upload/client"
import type { SubmissionFormValues } from "@/modules/submission/schema"

type City = { id: string; name: string; state: string }
type PropertyType = { id: string; name: string }

type UploadedImage = { url: string; uploading?: boolean }

export function PropertySubmissionForm({
  cities,
  propertyTypes,
}: {
  cities: City[]
  propertyTypes: PropertyType[]
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const form = useForm<SubmissionFormValues>({
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      purpose: "SALE",
      typeId: "",
      cityId: "",
      neighborhoodText: "",
      description: "",
      images: [],
    },
  })

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    setIsUploading(true)
    try {
      const signature = await createSubmissionImageUploadSignature()
      const files = Array.from(fileList)
      const uploaded = await Promise.all(files.map((file) => uploadPropertyImage(file, signature)))
      setImages((prev) => [...prev, ...uploaded.map((image) => ({ url: image.url }))])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao enviar fotos.")
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((image) => image.url !== url))
  }

  async function onSubmit(values: SubmissionFormValues) {
    setIsSubmitting(true)
    try {
      await createPropertySubmission({
        ...values,
        email: values.email || undefined,
        typeId: values.typeId || undefined,
        cityId: values.cityId || undefined,
        neighborhoodText: values.neighborhoodText || undefined,
        images: images.map((image) => image.url),
      })
      setSubmitted(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar seu imóvel. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[20px] border border-gold/30 bg-card p-10 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-gold/10 text-gold">
          <CheckCircle2 className="size-8" />
        </span>
        <h2 className="font-heading text-2xl font-semibold text-foreground">Recebemos seu imóvel!</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Nossa equipe vai avaliar as informações e entrar em contato em breve para conversar sobre a divulgação
          gratuita do seu imóvel.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 rounded-[20px] border border-border/60 bg-card p-5 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" placeholder="Seu nome completo" {...form.register("name", { required: true, minLength: 2 })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Telefone / WhatsApp</Label>
          <Input id="phone" placeholder="(11) 99999-9999" {...form.register("phone", { required: true, minLength: 8 })} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail (opcional)</Label>
        <Input id="email" type="email" placeholder="voce@email.com" {...form.register("email")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Tipo de imóvel</Label>
          <Controller
            control={form.control}
            name="typeId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Cidade</Label>
          <Controller
            control={form.control}
            name="cityId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name} - {city.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="neighborhoodText">Bairro</Label>
          <Input id="neighborhoodText" placeholder="Ex: Centro" {...form.register("neighborhoodText")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="askingPrice">Valor pretendido (opcional)</Label>
          <Input id="askingPrice" type="number" step="0.01" placeholder="R$" {...form.register("askingPrice")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descreva o imóvel</Label>
        <Textarea
          id="description"
          rows={5}
          placeholder="Conte sobre o imóvel: área, quartos, diferenciais, estado de conservação..."
          {...form.register("description", { required: true, minLength: 10 })}
        />
      </div>

      <div className="space-y-2">
        <Label>Fotos</Label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((image) => (
            <div key={image.url} className="group relative aspect-4/3 overflow-hidden rounded-lg border border-border/60 bg-secondary">
              <Image src={image.url} alt="" fill className="object-cover" sizes="150px" />
              <button
                type="button"
                onClick={() => removeImage(image.url)}
                className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}

          <label className="flex aspect-4/3 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-gold hover:text-gold">
            {isUploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
            {isUploading ? "Enviando..." : "Adicionar fotos"}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              disabled={isUploading}
              onChange={(event) => handleFiles(event.target.files)}
            />
          </label>
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full bg-gold text-accent-foreground hover:bg-gold-light"
        disabled={isSubmitting || isUploading}
      >
        {isSubmitting ? "Enviando..." : "Enviar meu imóvel"}
      </Button>
    </form>
  )
}
