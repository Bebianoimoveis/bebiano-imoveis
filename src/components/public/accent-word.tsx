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
      <svg
        viewBox="0 0 200 20"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute -bottom-1 left-0 h-3 w-full text-gold/80"
      >
        <path
          d="M2 11 Q 50 20, 100 9 T 198 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}
