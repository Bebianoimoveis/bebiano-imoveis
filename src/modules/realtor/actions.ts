"use server"

import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity-log"
import { ensureRealtorSlug } from "@/modules/realtor/service"
import { createRealtorSchema, updateRealtorSchema } from "@/modules/realtor/schema"

async function requireRealtorManage() {
  const session = await auth()
  if (!session?.user) throw new Error("Não autenticado.")
  if (!(await can(session.user, "realtor.manage"))) {
    throw new Error("Sem permissão para gerenciar corretores.")
  }
  return session
}

// Leitura simples usada para popular o seletor de corretor no formulário
// de imóveis.
export async function listRealtors() {
  const session = await auth()
  if (!session?.user) throw new Error("Não autenticado.")

  return prisma.realtor.findMany({
    where: { active: true, deletedAt: null },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  })
}

// Leitura pública — seção "Equipe" da home, sem checagem de sessão. Gera o
// slug na hora (mesmo padrão já usado no painel "Links dos Corretores")
// pra nunca deixar um corretor de fora só porque ainda não tem slug.
export async function listPublicRealtors() {
  const realtors = await prisma.realtor.findMany({
    where: { active: true, deletedAt: null },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  })

  return Promise.all(
    realtors.map(async (realtor) => ({
      ...realtor,
      slug: realtor.slug ?? (await ensureRealtorSlug(realtor.id, realtor.user.name)),
    }))
  )
}

export async function getPublicRealtorBySlug(slug: string) {
  const realtor = await prisma.realtor.findUnique({
    where: { slug },
    include: { user: true },
  })
  if (!realtor || !realtor.active || realtor.deletedAt) return null

  const [propertyCount, soldOrRentedCount] = await Promise.all([
    prisma.property.count({
      where: { realtorId: realtor.id, status: "PUBLISHED", deletedAt: null },
    }),
    prisma.contract.count({
      where: { realtorId: realtor.id, status: "COMPLETED" },
    }),
  ])

  return { ...realtor, propertyCount, soldOrRentedCount }
}

// Painel "Corretores" — CRUD completo, restrito a quem gerencia corretores.

export async function listAdminRealtors() {
  await requireRealtorManage()
  return prisma.realtor.findMany({
    where: { deletedAt: null },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  })
}

// Cria o corretor e a conta de acesso dele juntos (User com papel
// REALTOR) — não existe Realtor sem User no schema, então o formulário
// de "novo corretor" é também o de "nova conta de corretor".
export async function createRealtor(input: unknown) {
  const session = await requireRealtorManage()
  const data = createRealtorSchema.parse(input)

  const existingUser = await prisma.user.findUnique({ where: { email: data.email } })
  if (existingUser) throw new Error("Já existe um usuário com esse e-mail.")

  const role = await prisma.role.findUnique({ where: { name: "REALTOR" } })
  if (!role) throw new Error("Papel REALTOR não encontrado — rode o seed do banco.")

  const passwordHash = await bcrypt.hash(data.password, 12)

  const realtor = await prisma.realtor.create({
    data: {
      phone: data.phone,
      creci: data.creci || null,
      bio: data.bio || null,
      photoUrl: data.photoUrl || null,
      photoPositionY: data.photoPositionY ?? null,
      user: {
        create: {
          name: data.name,
          email: data.email,
          passwordHash,
          roleId: role.id,
        },
      },
    },
    include: { user: true },
  })

  await ensureRealtorSlug(realtor.id, realtor.user.name)

  await logActivity({
    userId: session.user.id,
    action: "realtor.create",
    entityType: "Realtor",
    entityId: realtor.id,
  })

  revalidatePath("/admin/corretores")
  revalidatePath("/admin/corretores/links")
  revalidatePath("/sobre")
  revalidatePath("/")
  return { id: realtor.id }
}

export async function updateRealtor(id: string, input: unknown) {
  const session = await requireRealtorManage()
  const data = updateRealtorSchema.parse(input)

  const realtor = await prisma.realtor.findUnique({ where: { id }, select: { userId: true } })
  if (!realtor) throw new Error("Corretor não encontrado.")

  const emailOwner = await prisma.user.findUnique({ where: { email: data.email } })
  if (emailOwner && emailOwner.id !== realtor.userId) {
    throw new Error("Já existe um usuário com esse e-mail.")
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: realtor.userId },
      data: { name: data.name, email: data.email },
    }),
    prisma.realtor.update({
      where: { id },
      data: {
        phone: data.phone,
        creci: data.creci || null,
        bio: data.bio || null,
        photoUrl: data.photoUrl || null,
        photoPositionY: data.photoPositionY ?? null,
      },
    }),
  ])

  await ensureRealtorSlug(id, data.name)

  await logActivity({
    userId: session.user.id,
    action: "realtor.edit",
    entityType: "Realtor",
    entityId: id,
  })

  revalidatePath("/admin/corretores")
  revalidatePath("/admin/corretores/links")
  revalidatePath("/sobre")
  revalidatePath("/")
  return { id }
}

// Desativar em vez de excluir: some da equipe pública e dos seletores,
// mas preserva o histórico de leads/propostas/contratos já vinculados a
// esse corretor.
export async function setRealtorActive(id: string, active: boolean) {
  const session = await requireRealtorManage()
  await prisma.realtor.update({ where: { id }, data: { active } })

  await logActivity({
    userId: session.user.id,
    action: active ? "realtor.activate" : "realtor.deactivate",
    entityType: "Realtor",
    entityId: id,
  })

  revalidatePath("/admin/corretores")
  revalidatePath("/admin/corretores/links")
  revalidatePath("/sobre")
  revalidatePath("/")
}
