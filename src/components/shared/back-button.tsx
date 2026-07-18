"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { cn } from "@/lib/utils"

export function BackButton({ className }: { className?: string }) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={cn(
        "group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary",
        className
      )}
    >
      <ArrowLeft className="size-4 transition-transform duration-200 ease-out group-hover:-translate-x-0.5" />
      Voltar
    </button>
  )
}
