"use server"

import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { logActivity } from "@/lib/activity-log"
import { invalidatePermissionsCache } from "@/lib/permissions"
import { createUserSchema, updateUserSchema } from "@/modules/user/schema"
import * as userRepository from "@/modules/user/repository"

async function requireUserManage() {
  const session = await auth()
  if (!session?.user) throw new Error("Não autenticado.")
  if (!(await can(session.user, "user.manage"))) {
    throw new Error("Sem permissão para gerenciar usuários.")
  }
  return session
}

export async function listAdminUsers() {
  await requireUserManage()
  return userRepository.listUsers()
}

export async function listRoles() {
  await requireUserManage()
  return userRepository.listRoles()
}

export async function createUser(input: unknown) {
  const session = await requireUserManage()
  const data = createUserSchema.parse(input)

  const existing = await userRepository.findUserByEmail(data.email)
  if (existing) throw new Error("Já existe um usuário com esse e-mail.")

  const passwordHash = await bcrypt.hash(data.password, 12)
  const user = await userRepository.createUser({
    name: data.name,
    email: data.email,
    roleId: data.roleId,
    passwordHash,
  })

  await logActivity({
    userId: session.user.id,
    action: "user.create",
    entityType: "User",
    entityId: user.id,
  })

  revalidatePath("/admin/usuarios")
  return user
}

export async function updateUser(id: string, input: unknown) {
  const session = await requireUserManage()
  const data = updateUserSchema.parse(input)

  const passwordHash = data.password ? await bcrypt.hash(data.password, 12) : undefined

  const user = await userRepository.updateUser(id, {
    name: data.name,
    email: data.email,
    roleId: data.roleId,
    passwordHash,
  })

  // O papel pode ter mudado — não deixar o cache de permissões desse
  // usuário (ou de qualquer sessão ativa com o mesmo papel) desatualizado.
  invalidatePermissionsCache(data.roleId)

  await logActivity({
    userId: session.user.id,
    action: "user.edit",
    entityType: "User",
    entityId: id,
  })

  revalidatePath("/admin/usuarios")
  return user
}

export async function setUserActive(id: string, active: boolean) {
  const session = await requireUserManage()
  const user = await userRepository.setUserActive(id, active)

  await logActivity({
    userId: session.user.id,
    action: active ? "user.activate" : "user.deactivate",
    entityType: "User",
    entityId: id,
  })

  revalidatePath("/admin/usuarios")
  return user
}
