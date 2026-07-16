"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
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
import { createUser, updateUser } from "@/modules/user/actions"

type RoleOption = { id: string; name: string }

type FormValues = {
  name: string
  email: string
  roleId: string
  password: string
}

type UserFormDialogProps = {
  trigger: React.ReactNode
  mode: "create" | "edit"
  userId?: string
  roles: RoleOption[]
  defaultValues?: { name: string; email: string; roleId: string }
}

export function UserFormDialog({
  trigger,
  mode,
  userId,
  roles,
  defaultValues,
}: UserFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    defaultValues: {
      name: defaultValues?.name ?? "",
      email: defaultValues?.email ?? "",
      roleId: defaultValues?.roleId ?? roles[0]?.id ?? "",
      password: "",
    },
  })

  async function onSubmit(values: FormValues) {
    if (mode === "create" && values.password.length < 8) {
      form.setError("password", { message: "A senha deve ter ao menos 8 caracteres." })
      return
    }
    if (values.password && values.password.length < 8) {
      form.setError("password", { message: "A senha deve ter ao menos 8 caracteres." })
      return
    }

    setIsSubmitting(true)
    try {
      if (mode === "create") {
        await createUser(values)
        toast.success("Usuário criado.")
      } else if (userId) {
        await updateUser(userId, values)
        toast.success("Usuário atualizado.")
      }
      setOpen(false)
      form.reset()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar usuário.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Novo usuário" : "Editar usuário"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...form.register("name", { required: true, minLength: 2 })} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" {...form.register("email", { required: true })} />
          </div>

          <div className="space-y-1.5">
            <Label>Papel</Label>
            <Controller
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">
              {mode === "create" ? "Senha" : "Nova senha (opcional)"}
            </Label>
            <Input id="password" type="password" {...form.register("password")} />
            {form.formState.errors.password ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
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
