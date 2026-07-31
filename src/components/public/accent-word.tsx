import { cn } from "@/lib/utils"

// Palavra de acento manuscrita em dourado, com um risco tipo assinatura
// por baixo — usada em uma palavra por título de seção no site público
// (ex: "Imóveis em <AccentWord>destaque</AccentWord>"), nunca em blocos
// de texto inteiros. Puramente decorativo, sem semântica própria — o
// título continua um <h2>/<h1> normal por fora.
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
      {/* Risco mais largo que a própria palavra (extrapola ~8% de cada
          lado) e mais grosso, pra ler como um traço de assinatura e não
          um sublinhado comum. Posicionado em "em" (acompanha o
          font-size acima) e afastado o bastante do texto pra não colidir
          com o rabicho de letras como "p"/"q" do script. */}
      <svg
        viewBox="0 0 200 14"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute -left-[8%] w-[116%] text-gold/80"
        style={{ bottom: "-0.95em", height: "0.32em" }}
      >
        <path
          d="M4 7 C 60 13, 140 13, 196 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </span>
  )
}
