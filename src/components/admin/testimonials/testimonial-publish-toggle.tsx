"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { updateTestimonial } from "@/modules/testimonial/actions"

export function TestimonialPublishToggle({ id, published }: { id: string; published: boolean }) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  async function handleToggle() {
    setIsPending(true)
    try {
      await updateTestimonial(id, { published: !published })
      toast.success(published ? "Depoimento ocultado." : "Depoimento publicado no site.")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button variant="ghost" size="sm" disabled={isPending} onClick={handleToggle}>
      {published ? "Ocultar" : "Publicar"}
    </Button>
  )
}
