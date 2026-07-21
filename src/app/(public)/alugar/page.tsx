import { redirect } from "next/navigation"

// A Bebiano Imóveis não trabalha com locação — só venda de imóveis novos
// (na planta) e usados. Mantido como redirect (em vez de remover a rota)
// para não quebrar links antigos já indexados/compartilhados.
export default function AlugarPage() {
  redirect("/comprar")
}
