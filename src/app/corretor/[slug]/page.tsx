import { redirect } from "next/navigation"

// A captura de fato (resolver o corretor, gravar a atribuição, setar o
// cookie) acontece em proxy.ts, que roda antes desta rota e sempre
// redireciona pra "/" — esta página nunca deveria renderizar de verdade.
// Existe só como rede de segurança: se por algum motivo a proxy deixar a
// requisição passar, o visitante ainda cai na home em vez de ver um 404.
export default function CorretorRedirectPage() {
  redirect("/")
}
