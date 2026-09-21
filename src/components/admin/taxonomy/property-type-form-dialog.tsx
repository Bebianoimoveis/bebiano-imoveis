"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { createPropertyType, updatePropertyType } from "@/modules/taxonomy/actions"

type PropertyTypeFormDialogProps = {
  trigger: React.ReactNode
  mode?: "create" | "edit"
  propertyTypeId?: string
  defaultName?: string
}

export function PropertyTypeFormDialog({
  trigger,
  mode = "create",
  propertyTypeId,
  defaultName = "",
}: PropertyTypeFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(defaultName)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (mode === "edit" && propertyTypeId) {
        await updatePropertyType(propertyTypeId, { name })
        toast.success("Tipo de imóvel atualizado.")
      } else {
        await createPropertyType({ name })
        toast.success("Tipo de imóvel cadastrado.")
        setName("")
      }
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar tipo de imóvel.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setName(defaultName)
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Editar tipo de imóvel" : "Novo tipo de imóvel"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="property-type-name">Nome</Label>
            <Input
              id="property-type-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Apartamento"
              required
              minLength={2}
            />
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
