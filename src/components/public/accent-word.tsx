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
    <span className={cn("font-script relative inline-block px-1 text-gold", className)}>
      {children}
      {/* Posicionado em unidades "em" (não rem/px fixos) pra acompanhar o
          tamanho da fonte em qualquer título, e afastado o bastante do
          texto (-1.05em) pra não colidir com o rabicho de letras como
          "p"/"q" do script, que descem bem abaixo da linha de base — era
          essa sobreposição que deixava a palavra "emaranhada". */}
      <svg
        viewBox="0 0 200 14"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute left-0 w-full text-gold/70"
        style={{ bottom: "-1.05em", height: "0.3em" }}
      >
        <path
          d="M4 7 C 60 13, 140 13, 196 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </span>
  )
}
