import { prisma } from "@/lib/prisma"

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// Não há CRUD de corretores nesta aplicação ainda (cadastro hoje é feito
// via script avulso) — este helper serve tanto o backfill dos corretores
// já existentes quanto o painel "Links dos Corretores", que gera o slug
// de qualquer corretor que ainda não tenha um na primeira vez que a
// página é carregada, em vez de depender de um formulário de edição que
// não existe.
export async function ensureRealtorSlug(realtorId: string, name: string): Promise<string> {
  const base = slugify(name) || "corretor"
  let candidate = base
  let attempt = 1

  while (true) {
    const existing = await prisma.realtor.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
    if (!existing || existing.id === realtorId) break
    attempt += 1
    candidate = `${base}-${attempt}`
  }

  await prisma.realtor.update({
    where: { id: realtorId },
    data: { slug: candidate },
  })

  return candidate
}
