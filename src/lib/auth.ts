import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
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

        if (isRateLimited(rateLimitKey, LOGIN_RATE_LIMIT)) {
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
          realtorId: user.realtor?.id ?? null,
        }
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.roleId = user.roleId
        token.roleName = user.roleName
        token.realtorId = user.realtorId
      }
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
