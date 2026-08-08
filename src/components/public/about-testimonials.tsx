import Image from "next/image"
import { Star, User } from "lucide-react"

import { Reveal } from "@/components/motion/reveal"
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group"
import { AccentWord } from "@/components/public/accent-word"
import { listPublicTestimonials } from "@/modules/testimonial/actions"

// Variante em scroll horizontal (pedido explícito da cliente para esta
// página) do mesmo cartão visual usado em TestimonialsSection na home —
// aqui a rolagem lateral é sempre com snap, não vira grade no desktop.
export async function AboutTestimonials() {
  const testimonials = await listPublicTestimonials(10)
  if (testimonials.length === 0) return null

  return (
    <section className="border-t border-border/60 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal className="mb-8 sm:mb-10">
          <p className="text-sm font-medium tracking-widest text-gold-dark uppercase">
            Quem já viveu a experiência
          </p>
          <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight">
            <AccentWord>Depoimentos</AccentWord>
          </h2>
        </Reveal>

        <StaggerGroup className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
          {testimonials.map((testimonial) => (
            <StaggerItem
              key={testimonial.id}
              className="w-[85vw] shrink-0 snap-start sm:w-[380px]"
            >
              <div className="flex h-full flex-col gap-4 rounded-2xl bg-card p-6 ring-1 ring-border/60">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={
                        i < testimonial.rating
                          ? "size-4 fill-gold text-gold"
                          : "size-4 text-muted-foreground/30"
                      }
                    />
                  ))}
                </div>
                <p className="flex-1 text-sm leading-relaxed text-foreground/85">
                  “{testimonial.message}”
                </p>
                <div className="flex items-center gap-3 border-t border-border/60 pt-4">
                  <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                    {testimonial.photoUrl ? (
                      <Image
                        src={testimonial.photoUrl}
                        alt={testimonial.name}
                        fill
                        className="object-cover object-top"
                        sizes="40px"
                      />
                    ) : (
                      <User className="size-4.5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{testimonial.name}</p>
                    {testimonial.city ? (
                      <p className="text-xs text-muted-foreground">{testimonial.city}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  )
}
