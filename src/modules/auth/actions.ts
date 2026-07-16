"use server"

import { AuthError } from "next-auth"

import { signIn, signOut } from "@/lib/auth"
import { loginSchema } from "@/modules/auth/schema"

export type LoginState = {
  error?: string
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: "Preencha e-mail e senha corretamente." }
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/admin",
    })
    return {}
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "E-mail ou senha inválidos." }
    }
    throw error
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/admin/login" })
}
