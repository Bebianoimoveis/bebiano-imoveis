import Image from "next/image"

import { LoginForm } from "@/components/admin/login-form"

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sessao?: string }>
}) {
  const { sessao } = await searchParams
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-1 text-center">
          <Image
            src="/images/logo.png"
            alt="Bebiano Imóveis"
            width={97}
            height={80}
            priority
            className="h-20 w-auto"
          />
          <p className="text-sm text-muted-foreground">
            Acesse o painel administrativo
          </p>
        </div>
        {sessao === "encerrada" ? (
          <p className="rounded-lg border border-gold/30 bg-gold/5 p-3 text-center text-sm">
            Sua sessão foi encerrada. Entre de novo.
          </p>
        ) : null}
        <LoginForm />
      </div>
    </div>
  )
}
