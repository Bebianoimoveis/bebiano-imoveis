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

// Usado pelo botão "Compartilhar" de imóvel: se quem está logado for
// corretor, devolve o próprio slug pra montar um link com atribuição
// (?ref=<slug>, já suportado pelo middleware de atribuição existente) —
// sem isso o link copiado não teria como saber quem indicou. Devolve o
// nome junto pra confirmação na tela deixar explícito de quem é o link
// (em vez de um "seu código" genérico, sem prova nenhuma de que pegou a
// pessoa certa).
export async function getCurrentUserRealtorShareInfo() {
  const session = await auth()
  if (!session?.user?.realtorId) return null

  const realtor = await prisma.realtor.findUnique({
    where: { id: session.user.realtorId },
    select: { slug: true, user: { select: { name: true } } },
  })
  if (!realtor) return null

  const slug = realtor.slug ?? (await ensureRealtorSlug(session.user.realtorId, realtor.user.name))
  return { slug, name: realtor.user.name }
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
// IMPORTANTE: validações abaixo devolvem { error } em vez de lançar
// exceção — em produção, um `throw` nestas duas ações (createRealtor e
// updateRealtor) faz a Server Action responder 500 (confirmado via
// reprodução direta contra produção: acontece com QUALQUER erro
// lançado daqui, incluindo com sessão/dados válidos e sem relação com
// e-mail duplicado especificamente). Devolver o erro como valor comum
// contorna o problema sem depender de entender a causa exata.
export async function createRealtor(
  input: unknown
): Promise<{ id: string; error?: undefined } | { id?: undefined; error: string }> {
  const session = await requireRealtorManage()
  const data = createRealtorSchema.parse(input)

  // As 3 chamadas abaixo são independentes entre si — rodar em paralelo
  // (em vez de sequencial) encurta bastante o tempo total da ação, que
  // já soma várias idas ao banco depois disso (create + slug + log +
  // revalidação). bcrypt custo 10 (em vez de 12): ainda seguro, só bem
  // mais rápido — 12 chegava a levar segundos.
  const [existingUser, role, passwordHash] = await Promise.all([
    prisma.user.findUnique({ where: { email: data.email } }),
    prisma.role.findUnique({ where: { name: "REALTOR" } }),
    bcrypt.hash(data.password, 10),
  ])
  if (existingUser) return { error: "Já existe um usuário com esse e-mail." }
  if (!role) return { error: "Papel REALTOR não encontrado — rode o seed do banco." }

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

export async function updateRealtor(
  id: string,
  input: unknown
): Promise<{ id: string; error?: undefined } | { id?: undefined; error: string }> {
  const session = await requireRealtorManage()
  const data = updateRealtorSchema.parse(input)

  const realtor = await prisma.realtor.findUnique({ where: { id }, select: { userId: true } })
  if (!realtor) return { error: "Corretor não encontrado." }

  const emailOwner = await prisma.user.findUnique({ where: { email: data.email } })
  if (emailOwner && emailOwner.id !== realtor.userId) {
    return { error: "Já existe um usuário com esse e-mail." }
  }

  const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : undefined

  await prisma.$transaction([
    prisma.user.update({
      where: { id: realtor.userId },
      data: { name: data.name, email: data.email, passwordHash },
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

// Exclusão é soft-delete (deletedAt), igual ao padrão já usado pra
// filtrar corretor em toda leitura (listAdminRealtors, listRealtors,
// listPublicRealtors etc.) — não apaga a linha de verdade, então leads,
// propostas, contratos e imóveis já vinculados continuam intactos. O
// e-mail da conta de usuário vinculada é liberado (renomeado) e o slug
// é limpo, pra dar pra cadastrar um novo corretor com o mesmo e-mail
// (ou o mesmo nome, sem ganhar um "-2") depois — slug tem constraint
// de unicidade no banco, então só filtrar por deletedAt na checagem de
// colisão não bastava: precisa liberar o valor de verdade.
export async function deleteRealtor(id: string) {
  const session = await requireRealtorManage()

  const realtor = await prisma.realtor.findUnique({
    where: { id },
    select: { id: true, deletedAt: true, userId: true, user: { select: { email: true } } },
  })
  if (!realtor || realtor.deletedAt) throw new Error("Corretor não encontrado.")

  await prisma.$transaction([
    prisma.realtor.update({
      where: { id },
      data: { deletedAt: new Date(), active: false, slug: null },
    }),
    prisma.user.update({
      where: { id: realtor.userId },
      data: { email: `deleted-${realtor.userId}-${realtor.user.email}`, active: false },
    }),
  ])

  await logActivity({
    userId: session.user.id,
    action: "realtor.delete",
    entityType: "Realtor",
    entityId: id,
  })

  revalidatePath("/admin/corretores")
  revalidatePath("/admin/corretores/links")
  revalidatePath("/sobre")
  revalidatePath("/")
}
