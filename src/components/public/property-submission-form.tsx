"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { useForm, Controller } from "react-hook-form"
import { toast } from "sonner"
import { CheckCircle2, FilePlus2, FileText, Film, ImagePlus, Loader2, Trash2, Video } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createPropertySubmission } from "@/modules/submission/actions"
import {
  createSubmissionDocumentUploadSignature,
  createSubmissionImageUploadSignature,
  createSubmissionVideoUploadSignature,
} from "@/modules/upload/actions"
import { uploadPropertyImage, uploadSubmissionFile } from "@/modules/upload/client"
import type { SubmissionFormValues } from "@/modules/submission/schema"
import {
  SUBMISSION_FEATURE_GROUPS,
  SUBMISSION_FEATURES,
  type SubmissionFeature,
} from "@/modules/submission/features"

type City = { id: string; name: string; state: string }
type PropertyType = { id: string; name: string }

type UploadedImage = { url: string; uploading?: boolean }
type UploadedFile = { url: string; name: string }

type QuantityField =
  | "bedrooms"
  | "suites"
  | "bathrooms"
  | "livingRooms"
  | "kitchens"
  | "parkingSpots"
  | "builtArea"
  | "totalArea"

const QUANTITY_FIELDS: { name: QuantityField; label: string; placeholder: string; decimal?: boolean }[] = [
  { name: "bedrooms", label: "Quartos", placeholder: "0" },
  { name: "suites", label: "Suítes", placeholder: "0" },
  { name: "bathrooms", label: "Banheiros", placeholder: "0" },
  { name: "livingRooms", label: "Salas", placeholder: "0" },
  { name: "kitchens", label: "Cozinhas", placeholder: "0" },
  { name: "parkingSpots", label: "Vagas de garagem", placeholder: "0" },
  { name: "builtArea", label: "Área construída (m²)", placeholder: "Ex: 120", decimal: true },
  { name: "totalArea", label: "Área do terreno (m²)", placeholder: "Ex: 250", decimal: true },
]

// Campo vazio = "não informado" (undefined), não zero — o dono pode não
// saber a metragem, e isso é diferente de dizer que o imóvel não tem.
function toOptionalNumber(value: string) {
  if (value === "" || value == null) return undefined
  const parsed = Number(String(value).replace(",", "."))
  return Number.isFinite(parsed) ? parsed : undefined
}

function FileUploadList({
  label,
  hint,
  files,
  icon: Icon,
  addIcon: AddIcon,
  addLabel,
  accept,
  uploading,
  disabled,
  onSelect,
  onRemove,
}: {
  label: string
  hint: string
  files: UploadedFile[]
  icon: React.ComponentType<{ className?: string }>
  addIcon: React.ComponentType<{ className?: string }>
  addLabel: string
  accept: string
  uploading: boolean
  disabled: boolean
  onSelect: (input: HTMLInputElement) => void
  onRemove: (url: string) => void
}) {
  return (
    <div className="space-y-2">
      <div>
        <Label>{label}</Label>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      </div>
      {files.length > 0 ? (
        <ul className="space-y-1.5">
          {files.map((file) => (
            <li
              key={file.url}
              className="flex min-w-0 items-center gap-2 rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-sm"
            >
              <Icon className="size-4 shrink-0 text-gold" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => onRemove(file.url)}
                aria-label={`Remover ${file.name}`}
                className="text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <label
        className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border py-4 text-xs text-muted-foreground transition-colors hover:border-gold hover:text-gold ${disabled ? "pointer-events-none opacity-60" : ""}`}
      >
        {uploading ? <Loader2 className="size-4 animate-spin" /> : <AddIcon className="size-4" />}
        {uploading ? "Enviando..." : addLabel}
        <input
          type="file"
          accept={accept}
          multiple
          className="hidden"
          disabled={disabled}
          onChange={(event) => onSelect(event.target)}
        />
      </label>
    </div>
  )
}

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
  const [videos, setVideos] = useState<UploadedFile[]>([])
  const [documents, setDocuments] = useState<UploadedFile[]>([])
  const [uploadingKind, setUploadingKind] = useState<"video" | "document" | null>(null)

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
      features: [],
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

  async function handleFileUpload(kind: "video" | "document", input: HTMLInputElement) {
    const fileList = input.files
    if (!fileList || fileList.length === 0) return
    setUploadingKind(kind)
    try {
      const signature =
        kind === "video"
          ? await createSubmissionVideoUploadSignature()
          : await createSubmissionDocumentUploadSignature()
      const uploaded = await Promise.all(
        Array.from(fileList).map((file) =>
          uploadSubmissionFile(file, signature, kind === "video" ? "video" : "raw")
        )
      )
      const setter = kind === "video" ? setVideos : setDocuments
      setter((prev) => [...prev, ...uploaded])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao enviar arquivo.")
    } finally {
      setUploadingKind(null)
      input.value = ""
    }
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
        videos,
        documents,
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
          <Controller
            control={form.control}
            name="askingPrice"
            render={({ field }) => <CurrencyInput value={field.value} onChange={field.onChange} />}
          />
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border/60 p-4">
        <div>
          <p className="text-sm font-medium">O que o imóvel tem</p>
          <p className="text-xs text-muted-foreground">Só coloque a quantidade. Deixe em branco o que não souber.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUANTITY_FIELDS.map((field) => (
            <div key={field.name} className="space-y-1.5">
              <Label htmlFor={field.name} className="text-xs">
                {field.label}
              </Label>
              <Input
                id={field.name}
                type="number"
                min={0}
                step={field.decimal ? "any" : 1}
                inputMode={field.decimal ? "decimal" : "numeric"}
                placeholder={field.placeholder}
                {...form.register(field.name, { setValueAs: toOptionalNumber })}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-border/60 p-4">
        <div>
          <p className="text-sm font-medium">Características</p>
          <p className="text-xs text-muted-foreground">Marque tudo o que o imóvel ou o condomínio tem.</p>
        </div>
        <Controller
          control={form.control}
          name="features"
          render={({ field }) => {
            const selected = new Set(field.value ?? [])
            function toggle(item: SubmissionFeature, checked: boolean) {
              // Lê o valor atual do form (não o `selected` desta renderização),
              // senão dois cliques seguidos antes de re-renderizar perdiam o
              // primeiro.
              const next = new Set(form.getValues("features") ?? [])
              if (checked) next.add(item)
              else next.delete(item)
              field.onChange(SUBMISSION_FEATURES.filter((feature) => next.has(feature)))
            }
            return (
              <div className="space-y-4">
                {SUBMISSION_FEATURE_GROUPS.map((group) => (
                  <div key={group.title} className="space-y-2">
                    <p className="text-xs font-medium tracking-wider text-gold-dark uppercase">{group.title}</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {group.items.map((item) => (
                        <label key={item} className="flex cursor-pointer items-center gap-2.5 text-sm">
                          <Checkbox
                            checked={selected.has(item)}
                            onCheckedChange={(checked) => toggle(item, checked === true)}
                          />
                          {item}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descreva o imóvel</Label>
        <Textarea
          id="description"
          rows={5}
          placeholder="Conte o que mais o imóvel tem: diferenciais, estado de conservação, área de lazer..."
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

      <FileUploadList
        label="Vídeos (opcional)"
        hint="Grave um tour pelo imóvel no celular. Até 100MB por vídeo."
        files={videos}
        icon={Film}
        addIcon={Video}
        addLabel="Adicionar vídeos"
        accept="video/mp4,video/quicktime,video/webm,video/3gpp"
        uploading={uploadingKind === "video"}
        disabled={uploadingKind !== null}
        onSelect={(input) => handleFileUpload("video", input)}
        onRemove={(url) => setVideos((prev) => prev.filter((file) => file.url !== url))}
      />

      <FileUploadList
        label="Documentação (opcional)"
        hint="Matrícula, IPTU, escritura ou outros documentos do imóvel. PDF ou foto, até 10MB cada."
        files={documents}
        icon={FileText}
        addIcon={FilePlus2}
        addLabel="Adicionar documentos"
        accept="application/pdf,image/jpeg,image/png"
        uploading={uploadingKind === "document"}
        disabled={uploadingKind !== null}
        onSelect={(input) => handleFileUpload("document", input)}
        onRemove={(url) => setDocuments((prev) => prev.filter((file) => file.url !== url))}
      />

      <Button
        type="submit"
        size="lg"
        className="w-full bg-gold text-black hover:bg-gold-light"
        disabled={isSubmitting || isUploading || uploadingKind !== null}
      >
        {isSubmitting ? "Enviando..." : "Enviar meu imóvel"}
      </Button>
    </form>
  )
}
