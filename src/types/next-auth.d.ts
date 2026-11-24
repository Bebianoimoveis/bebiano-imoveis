import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    roleId: string
    roleName: string
    realtorId: string | null
    stamp: string
  }

  interface Session {
    user: {
      id: string
      roleId: string
      roleName: string
      realtorId: string | null
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roleId: string
    roleName: string
    realtorId: string | null
    stamp?: string
  }
}
