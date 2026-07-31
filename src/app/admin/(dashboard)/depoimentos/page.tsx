import { Plus, MessageSquareQuote, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/shared/empty-state"
import { TestimonialFormDialog } from "@/components/admin/testimonials/testimonial-form-dialog"
import { TestimonialDeleteButton } from "@/components/admin/testimonials/testimonial-delete-button"
import { listAdminTestimonials } from "@/modules/testimonial/actions"

export default async function AdminTestimonialsPage() {
  const testimonials = await listAdminTestimonials()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Depoimentos
          </h1>
          <p className="text-sm text-muted-foreground">
            Depoimentos de clientes exibidos na home do site público.
          </p>
        </div>
        <TestimonialFormDialog
          mode="create"
          trigger={
            <Button>
              <Plus className="size-4" />
              Novo depoimento
            </Button>
          }
        />
      </div>

      {testimonials.length === 0 ? (
        <EmptyState
          icon={MessageSquareQuote}
          title="Nenhum depoimento cadastrado"
          description="Cadastre depoimentos de clientes para exibir na home do site."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Avaliação</TableHead>
                <TableHead>Depoimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-52" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {testimonials.map((testimonial) => (
                <TableRow key={testimonial.id}>
                  <TableCell className="font-medium">{testimonial.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {testimonial.city ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-0.5 text-gold">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="size-3.5"
                          fill={i < testimonial.rating ? "currentColor" : "none"}
                        />
                      ))}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {testimonial.message}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        testimonial.published
                          ? "border-transparent bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
                          : "border-transparent bg-muted text-muted-foreground"
                      }
                    >
                      {testimonial.published ? "Publicado" : "Oculto"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex items-center gap-1">
                    <TestimonialFormDialog
                      mode="edit"
                      testimonialId={testimonial.id}
                      defaultValues={{
                        name: testimonial.name,
                        city: testimonial.city,
                        rating: testimonial.rating,
                        message: testimonial.message,
                        photoUrl: testimonial.photoUrl,
                        published: testimonial.published,
                        order: testimonial.order,
                      }}
                      trigger={
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      }
                    />
                    <TestimonialDeleteButton id={testimonial.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
