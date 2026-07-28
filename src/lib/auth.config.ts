import type { NextAuthConfig } from "next-auth"

// Configuração enxuta, usada tanto pela proxy (proxy.ts) quanto pela
// config completa em auth.ts. Não importa Prisma nem bcrypt (Node-only) —
// a validação de credenciais fica exclusivamente em auth.ts.
//
// Sem callback `authorized`: a proxy usa uma função "wrapper" (em vez de
// reexportar `auth` puro) pra poder adicionar a captura de referral, e
// nesse formato o retorno booleano de `authorized` não bloqueia rota
// nenhuma sozinho — só um `Response` explícito seria respeitado. A lógica
// de redirecionar `/admin/*` sem sessão é replicada diretamente em
// proxy.ts, então manter esse callback aqui só criaria uma segunda fonte
// de verdade morta.
export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },
  providers: [],
} satisfies NextAuthConfig
