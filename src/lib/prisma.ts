import { neonConfig } from "@neondatabase/serverless"
import { PrismaNeon } from "@prisma/adapter-neon"
import ws from "ws"
import { PrismaClient } from "@/generated/prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// O runtime Node.js (Vercel Functions) não possui WebSocket nativo,
// diferente do runtime Edge — necessário para o pool de conexões do Neon.
neonConfig.webSocketConstructor = ws

// O adapter só deve ser criado quando um PrismaClient novo é de fato
// instanciado. Criá-lo incondicionalmente aqui abriria um Pool/WebSocket
// novo do Neon a cada hot-reload do Next.js em dev — mesmo quando o
// client em cache (globalForPrisma.prisma) já seria reaproveitado —,
// vazando conexões até o banco começar a recusar novas.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
