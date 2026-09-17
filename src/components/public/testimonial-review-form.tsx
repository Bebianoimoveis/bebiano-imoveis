"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { toast } from "sonner"
import { CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { StarRatingInput } from "@/components/public/star-rating-input"
import { submitTestimonialReview } from "@/modules/testimonial/actions"

type FormValues = {
  name: string
  city: string
  rating: number
  message: string
  highlight: string
  improvementNotes: string
  website: string
}

export function TestimonialReviewForm({
  realtorSlug,
  realtorName,
}: {
  realtorSlug: string
  realtorName: string
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<FormValues>({
    defaultValues: {
      name: "",
      city: "",
      rating: 0,
      message: "",
      highlight: "",
      improvementNotes: "",
      website: "",
    },
  })

  const rating = form.watch("rating")

  async function onSubmit(values: FormValues) {
    if (!values.rating) {
      toast.error("Escolha de 1 a 5 estrelas antes de enviar.")
      return
    }
    setIsSubmitting(true)
    try {
      await submitTestimonialReview({ ...values, realtorSlug })
      setSubmitted(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar sua avaliação.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[20px] border border-gold/30 bg-card p-10 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-gold/10 text-gold">
          <CheckCircle2 className="size-8" />
        </span>
        <h2 className="font-heading text-2xl font-semibold text-foreground">Muito obrigado!</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Sua avaliação foi enviada com sucesso e é muito importante para o crescimento da Bebiano Imóveis.
          Agradecemos de coração pelo seu tempo.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6 rounded-[20px] border border-border/60 bg-card p-5 sm:p-8"
    >
      {/* Honeypot — invisível pra gente, só bots de formulário preenchem. */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        {...form.register("website")}
      />

      <div className="space-y-2 text-center">
        <Label className="justify-center text-sm text-muted-foreground">
          Sua experiência com {realtorName}
        </Label>
        <Controller
          control={form.control}
          name="rating"
          render={({ field }) => (
            <div className="flex justify-center">
              <StarRatingInput value={field.value} onChange={field.onChange} />
            </div>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Seu nome</Label>
          <Input id="name" placeholder="Nome completo" {...form.register("name", { required: true, minLength: 2 })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">Cidade (opcional)</Label>
          <Input id="city" placeholder="Ex: Mogi das Cruzes" {...form.register("city")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Como foi sua experiência com a Bebiano Imóveis, do primeiro contato até a conclusão?</Label>
        <Textarea
          id="message"
          rows={4}
          placeholder="Conte um pouco sobre sua jornada com a gente..."
          {...form.register("message", { required: true, minLength: 10 })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="highlight">O que mais se destacou no atendimento do seu corretor(a)?</Label>
        <Textarea id="highlight" rows={3} {...form.register("highlight")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="improvementNotes">Tem alguma sugestão de melhoria para nós? (opcional)</Label>
        <Textarea id="improvementNotes" rows={3} {...form.register("improvementNotes")} />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || rating === 0}>
        {isSubmitting ? "Enviando..." : "Enviar avaliação"}
      </Button>
    </form>
  )
}
