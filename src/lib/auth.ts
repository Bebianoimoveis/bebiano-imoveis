import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { createHash } from "node:crypto"
import bcrypt from "bcryptjs"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth.config"
import { isRateLimited } from "@/lib/rate-limit"

// Sem isso, o login não tinha nenhum limite de tentativas — alguém podia
// tentar milhares de senhas por minuto contra uma conta específica
// (força bruta/credential stuffing). Chave por e-mail (não por IP): quem
// ataca já roda por trás de proxies/IPs rotativos, então travar a conta
// alvo é a defesa que realmente importa aqui.
const LOGIN_RATE_LIMIT = { maxAttempts: 8, windowMs: 10 * 60 * 1000 }

// Impressão da senha atual, guardada no token (que é cifrado). Se a senha
// mudar, a impressão muda e as sessões abertas com a senha antiga caem.
function passwordStamp(passwordHash: string) {
  return createHash("sha256").update(passwordHash).digest("hex").slice(0, 16)
}

type SessionUser = { roleId: string; roleName: string; realtorId: string | null; stamp: string }

// O token não sabe que a conta foi desativada, excluída, trocou de papel ou
// de senha; por isso cada sessão é conferida no banco. Guardado por poucos
// segundos porque uma página chama auth() várias vezes.
const SESSION_CHECK_TTL_MS = 10_000
const sessionUsers = new Map<string, { user: SessionUser | null; expiresAt: number }>()

async function loadSessionUser(userId: string): Promise<SessionUser | null> {
  const cached = sessionUsers.get(userId)
  if (cached && cached.expiresAt > Date.now()) return cached.user

  const row = await prisma.user.findFirst({
    where: { id: userId, active: true, deletedAt: null },
    select: {
      roleId: true,
      passwordHash: true,
      role: { select: { name: true } },
      realtor: { select: { id: true, active: true, deletedAt: true } },
    },
  })
  const user = row
    ? {
        roleId: row.roleId,
        roleName: row.role.name,
        realtorId: row.realtor?.active && !row.realtor.deletedAt ? row.realtor.id : null,
        stamp: passwordStamp(row.passwordHash),
      }
    : null
  sessionUsers.set(userId, { user, expiresAt: Date.now() + SESSION_CHECK_TTL_MS })
  return user
}

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (rawCredentials) => {
        const parsed = credentialsSchema.safeParse(rawCredentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data
        const rateLimitKey = email.trim().toLowerCase()

        if (await isRateLimited(rateLimitKey, LOGIN_RATE_LIMIT)) {
          throw new Error("Muitas tentativas de login. Aguarde alguns minutos e tente novamente.")
        }

        const user = await prisma.user.findUnique({
          where: { email, active: true, deletedAt: null },
          include: { role: true, realtor: true },
        })
        if (!user) return null

        const passwordMatches = await bcrypt.compare(
          password,
          user.passwordHash
        )
        if (!passwordMatches) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          roleId: user.roleId,
          roleName: user.role.name,
          realtorId: user.realtor?.active && !user.realtor.deletedAt ? user.realtor.id : null,
          stamp: passwordStamp(user.passwordHash),
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.roleId = user.roleId
        token.roleName = user.roleName
        token.realtorId = user.realtorId
        token.stamp = user.stamp
        if (user.id) sessionUsers.delete(user.id)
        return token
      }

      let current: SessionUser | null
      try {
        current = await loadSessionUser(token.sub as string)
      } catch {
        // Banco fora do ar por um instante: mantém a sessão. As consultas
        // da própria página falhariam do mesmo jeito, e derrubar o login
        // de todo mundo por uma oscilação seria pior.
        return token
      }
      // null encerra a sessão.
      if (!current || current.stamp !== token.stamp) return null

      token.roleId = current.roleId
      token.roleName = current.roleName
      token.realtorId = current.realtorId
      return token
    },
    session: ({ session, token }) => {
      session.user.id = token.sub as string
      session.user.roleId = token.roleId as string
      session.user.roleName = token.roleName as string
      session.user.realtorId = token.realtorId as string | null
      return session
    },
  },
})
