import { headers } from "next/headers"

// IP de quem chamou. x-real-ip é escrito pela plataforma; o primeiro valor
// de x-forwarded-for fica de reserva.
export async function getClientIp(): Promise<string> {
  const list = await headers()
  return list.get("x-real-ip")?.trim() || list.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
}
