"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

// Link de navegação com sublinhado que anima da esquerda pra direita no
// hover (via CSS puro — transform em vez de width evita layout thrashing
// e mantém 60fps sem precisar de JS/motion para algo tão simples).
export function NavLink({
  href,
  children,
  className,
  onClick,
}: {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group relative text-sm font-medium transition-colors",
        className
      )}
    >
      {children}
      <span
        className={cn(
          "absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-300 ease-out group-hover:scale-x-100",
          isActive && "scale-x-100"
        )}
      />
    </Link>
  )
}
