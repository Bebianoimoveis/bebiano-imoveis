import { cn } from "@/lib/utils"

// Palavra de acento manuscrita em dourado — usada em uma palavra por
// título de seção no site público (ex: "Imóveis em
// <AccentWord>destaque</AccentWord>"), nunca em blocos de texto
// inteiros. Puramente decorativo, sem semântica própria — o título
// continua um <h2>/<h1> normal por fora.
export function AccentWord({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "font-script relative inline-block translate-y-[0.06em] px-1.5 text-gold",
        className
      )}
      // Maior que o texto ao redor (1.45x) — no script fino/pequeno, do
      // mesmo tamanho do resto do título, a palavra passava despercebida
      // em vez de ler como um destaque de assinatura.
      style={{ fontSize: "1.45em", lineHeight: 1 }}
    >
      {children}
    </span>
  )
}
