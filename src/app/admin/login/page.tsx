import { LoginForm } from "@/components/admin/login-form"

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-1 text-center">
          <p className="font-heading text-2xl font-semibold tracking-tight text-primary">
            Bebiano Imóveis
          </p>
          <p className="text-sm text-muted-foreground">
            Acesse o painel administrativo
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
