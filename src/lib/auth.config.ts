import type { NextAuthConfig } from "next-auth"

// Configuração compatível com Edge Runtime, usada tanto pelo middleware
// quanto pela config completa em auth.ts. Não importa Prisma nem bcrypt
// (Node-only) — a validação de credenciais fica exclusivamente em auth.ts.
export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },
  providers: [],
  callbacks: {
    authorized: ({ auth, request }) => {
      const isLoggedIn = !!auth?.user
      const isOnAdmin = request.nextUrl.pathname.startsWith("/admin")
      const isOnLoginPage = request.nextUrl.pathname === "/admin/login"

      if (isOnLoginPage) {
        return !isLoggedIn ? true : Response.redirect(new URL("/admin", request.nextUrl))
      }

      if (isOnAdmin) {
        return isLoggedIn
      }

      return true
    },
  },
} satisfies NextAuthConfig
