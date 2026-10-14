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
      // A Parisienne tem minúsculas baixas e traço bem fino (um peso só):
      // mesmo do mesmo "tamanho de fonte" ela parecia menor que o título em
      // semi-negrito ao lado. 1.6em iguala a altura das minúsculas e o
      // contorno de 0.02em engrossa o traço pra ter o mesmo peso visual.
      style={{ fontSize: "1.6em", lineHeight: 1, WebkitTextStroke: "0.02em currentColor" }}
    >
      {children}
    </span>
  )
}
