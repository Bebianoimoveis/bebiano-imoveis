import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    roleId: string
    roleName: string
    realtorId: string | null
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
  }
}
