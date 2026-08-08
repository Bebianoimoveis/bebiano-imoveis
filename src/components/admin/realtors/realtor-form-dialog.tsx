"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createRealtor, updateRealtor } from "@/modules/realtor/actions"
import { createRealtorPhotoUploadSignature } from "@/modules/upload/actions"
import { uploadPropertyImage } from "@/modules/upload/client"

type FormValues = {
  name: string
  email: string
  password: string
  phone: string
  creci: string
  bio: string
  photoUrl: string
}

type RealtorFormDialogProps = {
  trigger: React.ReactNode
  mode: "create" | "edit"
  realtorId?: string
  defaultValues?: {
    name: string
    email: string
    phone: string
    creci: string
    bio: string
    photoUrl: string
  }
}

export function RealtorFormDialog({
  trigger,
  mode,
  realtorId,
  defaultValues,
}: RealtorFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const form = useForm<FormValues>({
    defaultValues: {
      name: defaultValues?.name ?? "",
      email: defaultValues?.email ?? "",
      password: "",
      phone: defaultValues?.phone ?? "",
      creci: defaultValues?.creci ?? "",
      bio: defaultValues?.bio ?? "",
      photoUrl: defaultValues?.photoUrl ?? "",
    },
  })

  const photoUrl = form.watch("photoUrl")

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const signature = await createRealtorPhotoUploadSignature()
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
    if (mode === "create" && values.password.length < 8) {
      form.setError("password", { message: "A senha deve ter ao menos 8 caracteres." })
      return
    }

    setIsSubmitting(true)
    try {
      if (mode === "create") {
        await createRealtor(values)
        toast.success("Corretor criado.")
      } else if (realtorId) {
        await updateRealtor(realtorId, values)
        toast.success("Corretor atualizado.")
      }
      setOpen(false)
      if (mode === "create") form.reset()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar corretor.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Novo corretor" : "Editar corretor"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
          <div className="flex items-center gap-4">
            <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-muted-foreground">
              {photoUrl ? (
                <Image src={photoUrl} alt="Foto do corretor" fill className="object-cover" sizes="64px" />
              ) : (
                <User className="size-7" />
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="photo">Foto de perfil</Label>
              <Input id="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} disabled={isUploading} />
              {isUploading ? <p className="text-xs text-muted-foreground">Enviando...</p> : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" autoComplete="off" {...form.register("name", { required: true, minLength: 2 })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <Input id="phone" placeholder="(11) 99999-9999" autoComplete="off" {...form.register("phone", { required: true, minLength: 8 })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail (login de acesso)</Label>
            <Input
              id="email"
              type="email"
              autoComplete="off"
              // Sem isso, o navegador oferece autopreencher com um login
              // salvo (ex: de um corretor cadastrado antes por engano com
              // o e-mail errado) — já aconteceu de o formulário abrir
              // pré-preenchido com credenciais de outra pessoa.
              data-1p-ignore
              data-lpignore="true"
              {...form.register("email", { required: true })}
            />
          </div>

          {mode === "create" ? (
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha de acesso</Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                data-1p-ignore
                data-lpignore="true"
                {...form.register("password")}
              />
              {form.formState.errors.password ? (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="creci">CRECI (opcional)</Label>
            <Input id="creci" {...form.register("creci")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio (opcional — aparece no perfil público)</Label>
            <Textarea id="bio" rows={3} {...form.register("bio")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
