"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Leitura simples usada para popular o seletor de corretor no formulário
// de imóveis. O CRUD completo de corretores é um módulo à parte, ainda
// não implementado.
export async function listRealtors() {
  const session = await auth()
  if (!session?.user) throw new Error("Não autenticado.")

  return prisma.realtor.findMany({
    where: { active: true, deletedAt: null },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  })
}
