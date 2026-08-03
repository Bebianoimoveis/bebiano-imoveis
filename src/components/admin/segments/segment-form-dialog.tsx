"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { SEGMENT_ICON_NAMES, resolveSegmentIcon } from "@/lib/segment-icons"
import { createSegment, updateSegment } from "@/modules/segment/actions"
import type { SegmentFormValues } from "@/modules/segment/schema"

type PropertyTypeOption = { id: string; name: string }

type SegmentFormDialogProps = {
  trigger: React.ReactNode
  mode: "create" | "edit"
  segmentId?: string
  propertyTypes: PropertyTypeOption[]
  defaultValues?: {
    name: string
    active: boolean
    order: number
    icon: string
    imageUrl: string | null
    propertyTypeId: string | null
    purpose: "SALE" | "RENT" | null
    isLaunch: boolean
    gatedCommunity: boolean
    minPrice: number | null
  }
}

const NONE = "__none__"

export function SegmentFormDialog({
  trigger,
  mode,
  segmentId,
  propertyTypes,
  defaultValues,
}: SegmentFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<SegmentFormValues>({
    defaultValues: {
      name: defaultValues?.name ?? "",
      active: defaultValues?.active ?? true,
      order: defaultValues?.order ?? 0,
      icon: defaultValues?.icon ?? "Home",
      imageUrl: defaultValues?.imageUrl ?? "",
      propertyTypeId: defaultValues?.propertyTypeId ?? "",
      purpose: defaultValues?.purpose ?? undefined,
      isLaunch: defaultValues?.isLaunch ?? false,
      gatedCommunity: defaultValues?.gatedCommunity ?? false,
      minPrice: defaultValues?.minPrice ?? undefined,
    },
  })

  async function onSubmit(values: SegmentFormValues) {
    setIsSubmitting(true)
    try {
      const payload = {
        ...values,
        imageUrl: values.imageUrl || undefined,
        propertyTypeId: values.propertyTypeId || undefined,
        minPrice: values.minPrice === ("" as unknown) ? undefined : values.minPrice,
      }

      if (mode === "create") {
        await createSegment(payload)
        toast.success("Segmento criado.")
      } else if (segmentId) {
        await updateSegment(segmentId, payload)
        toast.success("Segmento atualizado.")
      }
      setOpen(false)
      if (mode === "create") form.reset()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar segmento.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Novo segmento" : "Editar segmento"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...form.register("name", { required: true, minLength: 2 })} />
            </div>
            <div className="space-y-1.5">
              <Label>Ícone</Label>
              <Controller
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEGMENT_ICON_NAMES.map((name) => {
                        const Icon = resolveSegmentIcon(name)
                        return (
                          <SelectItem key={name} value={name}>
                            <span className="flex items-center gap-2">
                              <Icon className="size-4" />
                              {name}
                            </span>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo de imóvel (opcional)</Label>
              <Controller
                control={form.control}
                name="propertyTypeId"
                render={({ field }) => (
                  <Select
                    value={field.value || NONE}
                    onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Nenhum</SelectItem>
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
              <Label>Finalidade (opcional)</Label>
              <Controller
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <Select
                    value={field.value || NONE}
                    onValueChange={(v) => field.onChange(v === NONE ? undefined : v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Nenhuma</SelectItem>
                      <SelectItem value="SALE">Venda</SelectItem>
                      <SelectItem value="RENT">Locação</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="order">Ordem de exibição</Label>
              <Input id="order" type="number" step={1} {...form.register("order")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="minPrice">Preço mínimo (opcional)</Label>
              <Input id="minPrice" type="number" step="0.01" {...form.register("minPrice")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="imageUrl">URL da imagem (opcional)</Label>
            <Input id="imageUrl" {...form.register("imageUrl")} placeholder="https://..." />
            <p className="text-xs text-muted-foreground">
              Se vazio, usa automaticamente a foto de capa de um imóvel publicado que combine com este segmento.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <Controller
                control={form.control}
                name="isLaunch"
                render={({ field }) => (
                  <input
                    type="checkbox"
                    checked={!!field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="size-4 rounded border-border"
                  />
                )}
              />
              <span className="text-sm font-normal">Somente lançamentos</span>
            </label>
            <label className="flex items-center gap-2">
              <Controller
                control={form.control}
                name="gatedCommunity"
                render={({ field }) => (
                  <input
                    type="checkbox"
                    checked={!!field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="size-4 rounded border-border"
                  />
                )}
              />
              <span className="text-sm font-normal">Condomínio fechado</span>
            </label>
            <label className="flex items-center gap-2">
              <Controller
                control={form.control}
                name="active"
                render={({ field }) => (
                  <input
                    type="checkbox"
                    checked={!!field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="size-4 rounded border-border"
                  />
                )}
              />
              <span className="text-sm font-normal">Ativo (aparece na home)</span>
            </label>
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
