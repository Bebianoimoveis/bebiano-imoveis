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
      {/* Um único traço suave (sem inflexão em S) — com preserveAspectRatio
          "none" esticando pra largura da palavra, uma curva com troca de
          direção distorcia e ficava com aparência "quebrada". */}
      <svg
        viewBox="0 0 200 14"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute -bottom-1.5 left-0 h-2.5 w-full text-gold/70"
      >
        <path
          d="M4 4 C 60 13, 140 13, 196 3"
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
